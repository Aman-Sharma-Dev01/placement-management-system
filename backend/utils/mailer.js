const nodemailer = require('nodemailer');

/**
 * Nodemailer transport factory.
 *
 * Everything provider-specific lives here and nowhere else. Swapping SMTP
 * for SES/Postmark later means editing only `createTransport` — the email
 * service, templates and business logic stay untouched.
 */

let cachedTransport = null;
let cachedConfigSignature = null;

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

const buildConfig = () => {
  const port = Number(process.env.SMTP_PORT || 587);

  return {
    host: process.env.SMTP_HOST,
    port,
    // Implicit TLS on 465, STARTTLS elsewhere. `SMTP_SECURE=true` forces it.
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    pool: true,
    maxConnections: Number(process.env.SMTP_POOL_SIZE || 5),
    maxMessages: 100,
    // Fail fast rather than hanging a worker on a dead relay.
    connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.SMTP_TIMEOUT_MS || 20000),
  };
};

const configSignature = () =>
  [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_SECURE,
    process.env.SMTP_USER,
    process.env.SMTP_PASSWORD,
  ].join('|');

const getTransporter = () => {
  if (!isConfigured()) return null;

  const signature = configSignature();
  if (cachedTransport && cachedConfigSignature === signature) {
    return cachedTransport;
  }

  if (cachedTransport) {
    cachedTransport.close?.();
  }

  cachedTransport = nodemailer.createTransport(buildConfig());
  cachedConfigSignature = signature;
  return cachedTransport;
};

const fromAddress = () => ({
  name: process.env.SMTP_FROM_NAME || 'Placement Cell',
  address: process.env.SMTP_FROM || process.env.SMTP_USER || '',
});

/**
 * One round-trip to the relay. Used by the startup self-check and by the
 * admin diagnostics route. Never throws.
 */
const verifyConnection = async () => {
  if (!isConfigured()) {
    return { ok: false, configured: false, error: 'SMTP is not configured' };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { ok: true, configured: true, error: '' };
  } catch (error) {
    return { ok: false, configured: true, error: error.message };
  }
};

const resetTransport = () => {
  cachedTransport?.close?.();
  cachedTransport = null;
  cachedConfigSignature = null;
};

module.exports = {
  isConfigured,
  getTransporter,
  fromAddress,
  verifyConnection,
  resetTransport,
};