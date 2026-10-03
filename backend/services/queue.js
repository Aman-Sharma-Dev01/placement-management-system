/**
 * Lightweight in-process job queue.
 *
 * Purpose: keep SMTP latency (and retry backoff) completely off the HTTP
 * request path. A drive publish that fans out to 300 emails must return in
 * milliseconds; delivery happens here instead.
 *
 * This is intentionally dependency-free. `setImmediate` + a bounded FIFO is
 * enough for this workload. If delivery ever needs to survive restarts or
 * span multiple instances, swap `enqueue` internals for BullMQ — callers do
 * not change.
 */

const BATCH_SIZE = Number(process.env.EMAIL_BATCH_SIZE || 10);
const MAX_QUEUE_LENGTH = Number(process.env.EMAIL_MAX_QUEUE || 10000);
const DRAIN_INTERVAL_MS = Number(process.env.EMAIL_DRAIN_INTERVAL_MS || 250);

let queue = [];
let draining = false;
let drainTimer = null;
let droppedCount = 0;

const stats = () => ({
  pending: queue.length,
  draining,
  dropped: droppedCount,
  batchSize: BATCH_SIZE,
});

/**
 * Schedules a job. Never throws and never rejects — a full queue must not
 * become a business failure.
 * @param {() => Promise<any>} job
 * @param {number} delayMs optional delay for retry backoff
 */
const enqueue = (job, delayMs = 0) => {
  if (typeof job !== 'function') return false;

  if (queue.length >= MAX_QUEUE_LENGTH) {
    droppedCount += 1;
    console.error(
      `[emailQueue] Queue full (${MAX_QUEUE_LENGTH}). Dropped a job. ` +
        'Raise EMAIL_MAX_QUEUE or investigate SMTP throughput.'
    );
    return false;
  }

  const run = async () => {
    try {
      await job();
    } catch (error) {
      // Swallow: a failing email must never surface as an unhandled rejection.
      console.error('[emailQueue] Job failed:', error?.message || error);
    }
  };

  if (delayMs > 0) {
    setTimeout(() => enqueue(run), delayMs).unref?.();
    return true;
  }

  queue.push(run);
  scheduleDrain();
  return true;
};

const scheduleDrain = () => {
  if (drainTimer) return;
  drainTimer = setTimeout(drain, 0);
  drainTimer.unref?.();
};

const drain = async () => {
  drainTimer = null;
  if (draining) {
    scheduleDrain();
    return;
  }
  if (!queue.length) return;

  draining = true;
  try {
    while (queue.length) {
      const batch = queue.splice(0, BATCH_SIZE);
      // allSettled so one bad recipient cannot stall the rest of the batch.
      await Promise.allSettled(batch.map((run) => run()));
    }
  } finally {
    draining = false;
    if (queue.length) scheduleDrain();
  }
};

/** Periodic sweep, mainly so retries scheduled with a delay get picked up. */
const start = () => {
  if (drainTimer) return;
  drainTimer = setInterval(() => {
    if (queue.length && !draining) scheduleDrain();
  }, DRAIN_INTERVAL_MS);
  drainTimer.unref?.();
  console.log('[emailQueue] Started');
};

const stop = () => {
  if (drainTimer) {
    clearInterval(drainTimer);
    clearInterval(drainTimer);
    drainTimer = null;
  }
  queue = [];
};

module.exports = { enqueue, start, stop, stats };