const PlacementDrive = require('../models/PlacementDrive');
const Application = require('../models/Application');
const eligibilityService = require('./eligibilityService');
const notificationService = require('./notificationService');
const passwordResetService = require('./passwordResetService');
const queue = require('./queue');

/**
 * Reminder scheduler.
 *
 * There was no cron/queue infrastructure in this codebase, so this is a plain
 * interval that runs small idempotent sweeps. Every send is guarded by an
 * `eventKey` that includes the time bucket (e.g. `reminder:48h`), so a restart,
 * a double tick, or two instances running at once cannot produce two emails.
 *
 * Runs on a 15-minute tick. Cheap: it only queries drives whose deadline falls
 * inside a window, and applications with upcoming stages.
 */

const TICK_MS = Number(process.env.REMINDER_TICK_MS || 15 * 60 * 1000);
const ENABLED = process.env.REMINDER_SCHEDULER_ENABLED !== 'false';

// Deadline reminders at these horizons.
const DEADLINE_HORIZONS = [48, 24, 6];

let timer = null;
let running = false;

/** Parses the drive's stored deadline string ('YYYY-MM-DD HH:mm'). */
const parseDeadline = (value) => {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
};

const hoursUntil = (date) => (date.getTime() - Date.now()) / (1000 * 60 * 60);

/**
 * Finds open drives with a deadline inside the reminder horizon and notifies
 * eligible students who have not applied yet.
 */
const sweepDeadlines = async () => {
  const now = new Date();
  const furthest = new Date(now.getTime() + Math.max(...DEADLINE_HORIZONS) * 3600 * 1000);

  const drives = await PlacementDrive.find({
    status: 'open',
    deadlineDate: { $ne: '' },
  }).lean();

  for (const drive of drives) {
    const deadline = parseDeadline(drive.deadlineDate);
    if (!deadline) continue;
    // Skip anything already past or further out than our longest horizon.
    if (deadline <= now || deadline > furthest) continue;

    const remaining = hoursUntil(deadline);

    // Fire once per horizon bucket.
    const bucket = DEADLINE_HORIZONS.find(
      (h) => remaining <= h && remaining > (DEADLINE_HORIZONS[DEADLINE_HORIZONS.indexOf(h) + 1] ?? 0)
    );
    if (!bucket) continue;

    try {
      const students = await eligibilityService.findEligibleStudentsNotApplied(drive);
      if (!students.length) continue;

      await notificationService.deadlineReminder({
        drive,
        students,
        hoursLeft: bucket,
      });
      console.log(`[reminders] ${drive.companyName}: ${bucket}h reminder -> ${students.length} student(s)`);
    } catch (error) {
      console.error(`[reminders] Deadline sweep failed for drive ${drive._id}:`, error.message);
    }
  }
};

/**
 * Reminds students about hiring rounds happening soon. Only stages that are
 * not yet complete and whose scheduled date is inside the window.
 */
const sweepInterviews = async () => {
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 3600 * 1000);

  // Pull drives with any stage scheduled in the window, then match locally —
  // stage dates are strings so they cannot be range-queried in Mongo.
  const drives = await PlacementDrive.find({
    status: { $in: ['open', 'upcoming'] },
    'stages.scheduledDate': { $ne: '' },
  }).populate('stages');

  for (const drive of drives) {
    for (const stage of drive.stages) {
      if (stage.isCompleted) continue;

      const scheduled = parseDeadline(stage.scheduledDate);
      if (!scheduled) continue;
      if (scheduled <= now || scheduled > horizon) continue;

      // Only applicants who have actually reached this stage.
      const applications = await Application.find({
        driveId: drive._id,
        currentStageId: stage._id.toString(),
        status: { $nin: ['withdrawn', 'rejected', 'offered'] },
      }).populate('studentId');

      for (const application of applications) {
        const student = application.studentId;
        if (!student) continue;

        try {
          await notificationService.interviewEvent({
            application,
            student,
            drive,
            stage,
            kind: 'reminder',
          });
        } catch (error) {
          console.error(
            `[reminders] Interview reminder failed for application ${application._id}:`,
            error.message
          );
        }
      }
    }
  }
};

/** Drops long-expired reset tokens the TTL monitor has not caught. */
const sweepTokens = async () => {
  try {
    const removed = await passwordResetService.purgeExpired();
    if (removed) console.log(`[reminders] Purged ${removed} expired reset token(s)`);
  } catch (error) {
    console.error('[reminders] Token purge failed:', error.message);
  }
};

const tick = async () => {
  if (running) return;
  running = true;
  try {
    await sweepDeadlines();
    await sweepInterviews();
    await sweepTokens();
  } catch (error) {
    console.error('[reminders] Tick failed:', error.message);
  } finally {
    running = false;
  }
};

const start = () => {
  if (!ENABLED) {
    console.log('[reminders] Scheduler disabled (REMINDER_SCHEDULER_ENABLED=false)');
    return;
  }
  if (timer) return;

  timer = setInterval(tick, TICK_MS);
  timer.unref?.();
  console.log(`[reminders] Scheduler started (every ${Math.round(TICK_MS / 60000)} min)`);

  // First run shortly after boot so the server does not compete with startup.
  setTimeout(() => queue.enqueue(tick), 15000).unref?.();
};

const stop = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

module.exports = { start, stop, tick, sweepDeadlines, sweepInterviews, DEADLINE_HORIZONS };
