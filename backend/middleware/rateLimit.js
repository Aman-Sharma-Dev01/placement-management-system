/**
 * Fixed-window in-memory rate limiters.
 *
 * Purpose: blunt brute-force on login and mail-bombing of the password reset
 * endpoint. In-memory is honest about its limits — it resets when the process
 * restarts and is per-instance. If this ever runs behind more than one
 * instance, swap the counters for Redis without changing the call sites.
 */

const buckets = new Map();

const cleanup = () => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

// Cheap periodic sweep so the map cannot grow without bound.
const sweep = setInterval(cleanup, 60 * 1000);
sweep.unref?.();

/**
 * @param {object} options
 * @param {number} options.windowMs
 * @param {number} options.max        requests allowed per window
 * @param {string} options.name       bucket namespace
 * @param {string} [options.message]  body sent when the limit is hit
 * @param {boolean} [options.skipSuccessful] only count failures
 */
const createLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  name = 'default',
  message = 'Too many requests. Please try again later.',
  skipSuccessful = false,
}) => {
  const middleware = (req, res, next) => {
    const identifier =
      (req.user?._id || req.ip || req.socket?.remoteAddress || 'unknown').toString();
    const key = `${name}:${identifier}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      console.warn(`[rateLimit] ${name} limit hit by ${identifier}`);
      return res.status(429).json({ message, retryAfter });
    }

    // For login: refund the slot on a correct password so a busy shared IP is
    // not punished for legitimate use.
    if (skipSuccessful) {
      res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          bucket.count = Math.max(0, bucket.count - 1);
        }
      });
    }

    next();
  };

  return middleware;
};

// Credential stuffing protection. Generous enough for a shared campus network.
//
// `skipSuccessful` refunds the slot on a 2xx, which is correct for a sign-in
// (a busy shared IP should not be punished for legitimate use) but must NOT be
// reused for registration: a refunded slot would let a script create unlimited
// accounts. Registration therefore gets its own counting-only bucket.
const auth = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  name: 'auth',
  message: 'Too many attempts. Please wait a few minutes and try again.',
  skipSuccessful: true,
});

const registration = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.REGISTER_RATE_LIMIT_MAX || 10),
  name: 'register',
  message: 'Too many accounts created from this network. Please try again later.',
});

// Much tighter: every hit can send an email.
const passwordReset = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || 5),
  name: 'password-reset',
  message: 'Too many password reset requests. Please try again in a few minutes.',
});

// Email-adjacent write endpoints.
const notificationWrites = createLimiter({
  windowMs: 60 * 1000,
  max: Number(process.env.NOTIFICATION_RATE_LIMIT_MAX || 30),
  name: 'notification-writes',
});

const reset = () => buckets.clear();

module.exports = { createLimiter, auth, registration, passwordReset, notificationWrites, reset };
