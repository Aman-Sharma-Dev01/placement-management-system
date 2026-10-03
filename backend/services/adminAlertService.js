/**
 * Super-admin-only infrastructure alerts.
 *
 * Deliberately narrow: SMTP trouble and hard system failures. Ordinary
 * placement workflow never comes here — that belongs to the placement cell
 * and coordinators, and spamming super admins makes them ignore alerts.
 *
 * `emailService` is required lazily inside the function to break the require
 * cycle (emailService -> adminAlertService -> emailService).
 */

let notifiedThisWindow = false;
let windowStartedAt = Date.now();
const ALERT_WINDOW_MS = Number(process.env.ADMIN_ALERT_WINDOW_MS || 15 * 60 * 1000);

const withinWindow = () => {
  if (Date.now() - windowStartedAt > ALERT_WINDOW_MS) {
    windowStartedAt = Date.now();
    notifiedThisWindow = false;
  }
  return notifiedThisWindow;
};

/** Finds real super admins. Never falls back to "everyone". */
const findSuperAdmins = async () => {
  const User = require('../models/User');
  return User.find({ role: 'super_admin' }).select('email name _id');
};

/**
 * Emails super admins about a system-level failure, at most once per window.
 */
const notifyAdminsOfFailure = async ({ reason, details = [], recommendation, eventKey }) => {
  if (withinWindow()) return false;

  try {
    const emailService = require('./emailService');

    const admins = await findSuperAdmins();
    if (!admins.length) {
      console.error(`[adminAlert] ${reason} — no super admin exists to notify`);
      return false;
    }

    await emailService.sendMany({
      eventType: 'SYSTEM_ALERT',
      recipients: admins,
      data: () => ({
        title: reason,
        headline: reason,
        details,
        recommendation,
        eventKey,
      }),
      subject: `[System] ${reason}`,
    });

    notifiedThisWindow = true;
    console.error(`[adminAlert] Notified ${admins.length} super admin(s): ${reason}`);
    return true;
  } catch (error) {
    console.error('[adminAlert] Failed to notify admins:', error.message);
    return false;
  }
};

/** Unhandled rejection / uncaught exception hook used by server.js. */
const notifyAdminsOfCrash = async (kind, message) =>
  notifyAdminsOfFailure({
    reason: `Unhandled ${kind} on the server`,
    details: [
      ['Type', kind],
      ['Message', String(message).slice(0, 500)],
      ['Time', new Date().toISOString()],
    ],
    recommendation:
      'Check the server logs for the stack trace. The affected request failed, but the service stayed up.',
    eventKey: `crash:${kind}:${Date.now()}`,
  });

module.exports = { notifyAdminsOfFailure, notifyAdminsOfCrash };