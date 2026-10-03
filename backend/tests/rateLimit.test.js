const test = require('node:test');
const assert = require('node:assert/strict');

const { createLimiter, registration, reset } = require('../middleware/rateLimit');

/** Minimal Express-ish response double with manual finish control. */
const fakeRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    finishListeners: [],
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    on(event, listener) {
      if (event === 'finish') this.finishListeners.push(listener);
      return this;
    },
    /** Simulates the response finishing with the given status code. */
    finish(code) {
      this.statusCode = code;
      this.finishListeners.forEach((listener) => listener());
      return this;
    },
  };
  return res;
};

const fakeReq = (ip = '10.0.0.1') => ({ ip, socket: {} });

/** Runs the limiter and reports whether the request was let through. */
const attempt = (limiter, ip, finishCode) => {
  const res = fakeRes();
  let allowed = true;
  limiter(fakeReq(ip), res, () => {});
  if (res.statusCode === 429) allowed = false;
  if (allowed && finishCode !== undefined) res.finish(finishCode);
  return allowed;
};

test('rateLimit: a counting limiter blocks once max is exceeded', () => {
  reset();
  const limiter = createLimiter({ windowMs: 60_000, max: 3, name: 'test-count' });

  assert.equal(attempt(limiter, '1.1.1.1'), true);
  assert.equal(attempt(limiter, '1.1.1.1'), true);
  assert.equal(attempt(limiter, '1.1.1.1'), true);
  assert.equal(attempt(limiter, '1.1.1.1'), false, 'the fourth attempt is blocked');
});

test('rateLimit: buckets are isolated per IP', () => {
  reset();
  const limiter = createLimiter({ windowMs: 60_000, max: 1, name: 'test-isolation' });

  assert.equal(attempt(limiter, '2.2.2.2'), true);
  assert.equal(attempt(limiter, '2.2.2.2'), false, 'the second attempt from 2.2.2.2 is blocked');
  assert.equal(attempt(limiter, '3.3.3.3'), true, 'a different IP has its own budget');
});

test('rateLimit: skipSuccessful refunds the slot after a 2xx', () => {
  reset();
  const limiter = createLimiter({
    windowMs: 60_000,
    max: 2,
    name: 'test-refund',
    skipSuccessful: true,
  });

  // Successful logins must not consume the failure budget, otherwise a shared
  // campus IP locks out everyone for the rest of the window.
  for (let i = 0; i < 6; i += 1) {
    assert.equal(attempt(limiter, '4.4.4.4', 200), true);
  }

  // Only now does the real cap apply to failures.
  assert.equal(attempt(limiter, '4.4.4.4', 401), true);
  assert.equal(attempt(limiter, '4.4.4.4', 401), true);
  assert.equal(attempt(limiter, '4.4.4.4', 401), false, 'failures are capped');
});

test('rateLimit: a non-2xx response is still counted even with skipSuccessful', () => {
  reset();
  const limiter = createLimiter({
    windowMs: 60_000,
    max: 2,
    name: 'test-no-refund-on-error',
    skipSuccessful: true,
  });

  assert.equal(attempt(limiter, '5.5.5.5', 500), true);
  assert.equal(attempt(limiter, '5.5.5.5', 500), true);
  assert.equal(attempt(limiter, '5.5.5.5', 500), false);
});

test('security: registration is not refunded by a successful sign-up', () => {
  reset();

  // `registration` has no skipSuccessful, so a script cannot create unlimited
  // accounts by simply having each attempt succeed.
  let allowed = 0;
  for (let i = 0; i < 25; i += 1) {
    if (attempt(registration, '6.6.6.6', 201)) allowed += 1;
  }

  const max = Number(process.env.REGISTER_RATE_LIMIT_MAX || 10);
  assert.equal(allowed, max, `only ${max} accounts may be created per window`);
});

test('rateLimit: the expired window is released', async () => {
  reset();
  const limiter = createLimiter({ windowMs: 40, max: 1, name: 'test-window' });

  assert.equal(attempt(limiter, '7.7.7.7'), true);
  assert.equal(attempt(limiter, '7.7.7.7'), false);

  await new Promise((resolve) => setTimeout(resolve, 70));

  assert.equal(attempt(limiter, '7.7.7.7'), true, 'the bucket resets after the window');
});

test('rateLimit: the limit is advertised through headers', () => {
  reset();
  const limiter = createLimiter({ windowMs: 60_000, max: 5, name: 'test-headers' });

  const res = fakeRes();
  limiter(fakeReq('8.8.8.8'), res, () => {});

  assert.equal(res.headers['X-RateLimit-Limit'], '5');
  assert.equal(res.headers['X-RateLimit-Remaining'], '4');
  assert.ok(res.headers['X-RateLimit-Reset']);
});

test('rateLimit: an authenticated user is keyed by id, not IP', () => {
  reset();
  const limiter = createLimiter({ windowMs: 60_000, max: 1, name: 'test-user-id' });

  const shared = { ip: '9.9.9.9', socket: {} };
  const asA = fakeRes();
  limiter({ ...shared, user: { _id: 'user-a' } }, asA, () => {});

  const asB = fakeRes();
  limiter({ ...shared, user: { _id: 'user-b' } }, asB, () => {});

  assert.equal(asA.statusCode, 200);
  assert.equal(asB.statusCode, 200, 'two users behind one IP do not share a bucket');
});
