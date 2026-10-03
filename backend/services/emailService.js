const mailer = require('../utils/mailer');
const queue = require('./queue');
const EmailLog = require('../models/EmailLog');
const Notification = require('../models/Notification');
const { renderTemplate } = require('../emailTemplates');
const { notifyAdminsOfFailure } = require('./adminAlertService');

/**
 * Transactional email delivery.
 *
 * Contract with every caller: `send()` NEVER throws and NEVER rejects. Email is
 * a side channel — a dead SMTP relay must not be able to fail a registration,
 * an application, a verification or a drive publish.
 */

const MAX_ATTEMPTS = Number(process.env.EMAIL_MAX_ATTEMPTS || 3);
// Backoff between attempts. Index 0 is unused; attempt N waits DELAYS[N-1].
const RETRY_DELAYS_MS = String(process.env.EMAIL_RETRY_DELAYS_MS || '30000,120000')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value >= 0);

const TRANSIENT_CODES = new Set([
  'ETIMEDOUT',
  'ESOCKET',
  'ECONNECTION',
  'ECONNREFUSED',
  'EENVELOPE',
  'EMESSAGE',
  'EAUTH',
  'EDNS',
]);

let consecutiveFailures = 0;
const FAILURE_ALERT_THRESHOLD = Number(process.env.EMAIL_FAILURE_ALERT_THRESHOLD || 5);

const resetFailureCounter = () => {
  consecutiveFailures = 0;
};

/**
 * Mirrors the outcome onto the in-app notification so the admin UI can show
 * delivery state without joining EmailLog.
 */
const syncNotification = (notificationId, patch = {}) => {
  if (!notificationId) return Promise.resolve();
  return Notification.updateOne({ _id: notificationId }, { $set: patch }).catch(() => {});
};

const classify = (error) => {
  const code = error?.code || '';
  // 4xx recipient problems will not fix themselves on retry.
  const permanent =
    code === 'EENVELOPE' && /invalid recipient|does not exist/i.test(error.message || '');
  if (permanent) return 'permanent';
  if (TRANSIENT_CODES.has(code)) return 'transient';
  return 'unknown';
};

const recordFailure = async (log, error) => {
  consecutiveFailures += 1;
  console.error(
    `[emailService] Delivery failed (${log.recipient}) attempt ${log.attempts}/${log.maxAttempts}: ${error.message}`
  );

  if (consecutiveFailures >= FAILURE_ALERT_THRESHOLD) {
    // Only super admins, only for infrastructure trouble.
    notifyAdminsOfFailure({
      reason: 'Repeated email delivery failures',
      details: [
        ['Consecutive failures', String(consecutiveFailures)],
        ['Last error', error.message],
        ['Last recipient', log.recipient],
        ['Event', log.eventType],
      ],
      recommendation:
        'Check SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD, and confirm the Gmail app password is still valid.',
    });
  }
};

/**
 * Renders a template and queues delivery. Safe to call from a controller.
 *
 * @param {object} params
 * @param {string} params.eventType    template key, e.g. 'PROFILE_VERIFIED'
 * @param {object} params.recipient    { email, name, userId }
 * @param {object} [params.data]       template variables
 * @param {string} [params.subject]    override subject
 * @returns {boolean} whether the job was queued
 */
const send = async ({ eventType, recipient, data = {}, subject, notificationId = null, entityType = '', entityId = '' }) => {
  const to = String(recipient?.email || '').trim().toLowerCase();

  // Edge case: user has no usable email address.
  if (!to || !to.includes('@')) {
    console.warn(`[emailService] Skipping ${eventType}: no valid recipient email`);
    return false;
  }

  // Edge case: SMTP not configured at all. Log it, do not retry, do not fail.
  if (!mailer.isConfigured()) {
    console.warn(
      `[emailService] SMTP not configured — "${eventType}" for ${to} was not sent. ` +
        'Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD in backend/.env'
    );
    await EmailLog.create({
      recipient: to,
      recipientName: recipient?.name || '',
      userId: recipient?.userId || null,
      eventType,
      subject: subject || eventType,
      status: 'SKIPPED',
      lastError: 'SMTP not configured',
      notificationId,
      entityType,
      entityId,
    }).catch(() => {});
    return false;
  }

  let rendered;
  try {
    rendered = renderTemplate(eventType, data);
  } catch (error) {
    // Template rendering failure is a bug, not a transient fault. Surface it
    // loudly to admins but never throw at the caller.
    console.error(`[emailService] Template render failed for ${eventType}: ${error.message}`);
    await EmailLog.create({
      recipient: to,
      recipientName: recipient?.name || '',
      userId: recipient?.userId || null,
      eventType,
      subject: subject || eventType,
      status: 'FAILED',
      maxAttempts: 1,
      attempts: 1,
      lastError: `Template render failed: ${error.message}`,
      notificationId,
      entityType,
      entityId,
    }).catch(() => {});
    return false;
  }

  const emailLog = await EmailLog.create({
    recipient: to,
    recipientName: recipient?.name || '',
    userId: recipient?.userId || null,
    eventType,
    subject: subject || rendered.subject,
    status: 'QUEUED',
    maxAttempts: MAX_ATTEMPTS,
    attempts: 0,
    notificationId,
    entityType,
    entityId,
  }).catch((error) => {
    console.error('[emailService] Could not create EmailLog:', error.message);
    return null;
  });

  const logId = emailLog?._id;
  const eventKey = emailLog ? `${eventType}:${to}` : '';

  const deliver = async (attempt) => {
    if (logId) {
      await EmailLog.updateOne({ _id: logId }, {
        $set: { status: attempt === 1 ? 'SENDING' : 'RETRYING' },
        $inc: { attempts: 1 },
      }).catch(() => {});
    }

    try {
      const transporter = mailer.getTransporter();
      const info = await transporter.sendMail({
        from: mailer.fromAddress(),
        to: rendered.to || to,
        subject: subject || rendered.subject,
        html: rendered.html,
        text: rendered.text,
        // Keeps deliverability diagnostics out of the template.
        headers: { 'X-Portal-Event': eventType },
      });

      resetFailureCounter();

      if (logId) {
        await EmailLog.updateOne({ _id: logId }, {
          $set: {
            status: 'SENT',
            sentAt: new Date(),
            lastError: '',
            messageId: info?.messageId || '',
          },
        }).catch(() => {});
      }
      await syncNotification(notificationId, {
        emailSent: true,
        emailSentAt: new Date(),
        emailError: '',
      });
      return true;
    } catch (error) {
      const kind = classify(error);
      const canRetry = kind !== 'permanent' && attempt < MAX_ATTEMPTS;

      if (canRetry) {
        const delay = RETRY_DELAYS_MS[attempt - 1] ?? 60000;
        if (logId) {
          await EmailLog.updateOne({ _id: logId }, {
            $set: { status: 'RETRYING', lastError: error.message },
          }).catch(() => {});
        }
        await syncNotification(notificationId, {
          emailAttempts: attempt,
          emailError: `Retrying: ${error.message}`,
        });
        console.warn(
          `[emailService] Retrying ${eventType} -> ${to} in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})`
        );
        queue.enqueue(() => deliver(attempt + 1), delay);
        return false;
      }

      if (logId) {
        await EmailLog.updateOne({ _id: logId }, {
          $set: {
            status: 'FAILED',
            failedAt: new Date(),
            lastError: `${kind}: ${error.message}`,
          },
        }).catch(() => {});
      }
      await syncNotification(notificationId, {
        emailAttempts: attempt,
        emailError: `${kind}: ${error.message}`,
      });

      await recordFailure(
        { recipient: to, attempts: attempt, maxAttempts: MAX_ATTEMPTS, eventType },
        error
      );
      return false;
    }
  };

  // Off the request path entirely.
  queue.enqueue(() => deliver(1));
  return true;
};

/**
 * Fan-out helper. Queues one job per recipient without awaiting delivery.
 * @param {Array<{email:string,name?:string,userId?:string}>} recipients
 */
const sendMany = async ({ eventType, recipients, data = () => ({}), ...rest }) => {
  if (!Array.isArray(recipients) || !recipients.length) return 0;

  // De-duplicate by email: the same person can appear twice via linked records.
  const seen = new Set();
  const unique = recipients.filter((recipient) => {
    const key = String(recipient?.email || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let queued = 0;
  for (const recipient of unique) {
    const ok = await send({
      eventType,
      recipient,
      data: data(recipient),
      ...rest,
    });
    if (ok) queued += 1;
  }

  return queued;
};

/** Startup self-check; logs a warning rather than crashing the server. */
const verifyTransport = async () => {
  const result = await mailer.verifyConnection();
  if (result.ok) {
    console.log(`✅ Email (SMTP) ready: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
  } else if (!result.configured) {
    console.warn('⚠️  Email not configured — set SMTP_HOST/SMTP_USER/SMTP_PASSWORD in backend/.env');
  } else {
    console.warn(`⚠️  Email SMTP verification failed: ${result.error}`);
  }
  return result;
};

module.exports = { send, sendMany, verifyTransport, MAX_ATTEMPTS };