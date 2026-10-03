const crypto = require('crypto');
const PasswordResetToken = require('../models/PasswordResetToken');

/**
 * Password reset token lifecycle.
 *
 * Design notes:
 *  - The raw token is 64 hex chars of CSPRNG output. It exists only inside
 *    the reset email; the database stores SHA-256(token) so a database dump
 *    is not a set of working reset links.
 *  - `find` is a read, `consume` is a single atomic findOneAndUpdate, so two
 *    concurrent clicks on the same link cannot both succeed.
 *  - Issuing a new token revokes every previous unused token for that user.
 */

const TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60);
// Anti-abuse: at most 3 live reset links per account at any time.
const MAX_ACTIVE_TOKENS = Number(process.env.PASSWORD_RESET_MAX_ACTIVE || 3);

const sha256 = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

/** Constant-time compare of two hex digests. */
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Creates a new token for a user and revokes their older ones.
 * @returns {{ rawToken: string, expiresAt: Date, ttlMinutes: number }}
 */
const issue = async ({ userId, requestIp = '' }) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  // Revoke previous unused links: only the newest email works.
  await PasswordResetToken.updateMany(
    { userId, usedAt: null },
    { $set: { usedAt: new Date() } }
  ).catch(() => {});

  await PasswordResetToken.create({
    userId,
    tokenHash: sha256(rawToken),
    expiresAt,
    requestIp,
  });

  return { rawToken, expiresAt, ttlMinutes: TOKEN_TTL_MINUTES };
};

/** Looks up a token without consuming it, so the controller can validate it. */
const find = async (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) {
    return { valid: false, reason: 'malformed' };
  }

  const record = await PasswordResetToken.findOne({ tokenHash: sha256(rawToken) })
    .populate('userId', 'name email role')
    .lean();

  if (!record) return { valid: false, reason: 'invalid' };
  if (record.usedAt) return { valid: false, reason: 'used' };
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, reason: 'ok', record };
};

/**
 * Atomically marks a token used. Returns the populated user on success.
 * This is the single point where a link stops working.
 */
const consume = async (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) {
    return { valid: false, reason: 'malformed' };
  }

  const record = await PasswordResetToken.findOneAndUpdate(
    {
      tokenHash: sha256(rawToken),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { new: true }
  )
    .populate('userId', 'name email role')
    .lean();

  if (!record) return { valid: false, reason: 'invalid_or_used' };
  if (!record.userId) return { valid: false, reason: 'user_deleted' };

  return { valid: true, reason: 'ok', record, user: record.userId };
};

/** Hard cap on live links so the table cannot be spammed via the API. */
const enforceCap = async (userId) => {
  const live = await PasswordResetToken.find({ userId, usedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  if (live.length <= MAX_ACTIVE_TOKENS) return;

  const stale = live.slice(MAX_ACTIVE_TOKENS).map((doc) => doc._id);
  await PasswordResetToken.updateMany(
    { _id: { $in: stale } },
    { $set: { usedAt: new Date() } }
  ).catch(() => {});
};

/** Housekeeping: drop long-expired rows the TTL monitor has not caught yet. */
const purgeExpired = async () => {
  const result = await PasswordResetToken.deleteMany({
    expiresAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });
  return result?.deletedCount || 0;
};

module.exports = {
  issue,
  find,
  consume,
  enforceCap,
  purgeExpired,
  sha256,
  safeEqual,
  TOKEN_TTL_MINUTES,
};