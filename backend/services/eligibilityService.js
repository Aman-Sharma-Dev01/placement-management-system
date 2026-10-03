const Student = require('../models/Student');
const Application = require('../models/Application');
const PlacementDrive = require('../models/PlacementDrive');

/**
 * Eligibility evaluation.
 *
 * The `eligibility` rules on PlacementDrive existed but were never actually
 * evaluated anywhere — drives stored them and nothing read them. This module
 * is the single place that decides whether a student matches a drive, so
 * email targeting (and any future server-side enforcement) stays consistent.
 *
 * Note: `allowedCategories` is intentionally ignored. The `category` field was
 * removed from the Student model, so there is nothing left to match against.
 */

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const numOrNull = (value) => {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Evaluates one student against one drive's rules.
 * @returns {{ eligible: boolean, reasons: string[], summary: string[] }}
 */
const evaluate = (student, drive) => {
  const rules = drive?.eligibility || {};
  const reasons = [];
  const summary = [];

  if (!student || !drive) {
    return { eligible: false, reasons: ['Student or drive not found'], summary };
  }

  // --- Branch -----------------------------------------------------------
  const allowedBranches = Array.isArray(rules.allowedBranches) ? rules.allowedBranches : [];
  if (allowedBranches.length) {
    if (allowedBranches.includes(student.branch)) {
      summary.push(`Branch: ${student.branch}`);
    } else {
      reasons.push(`Branch ${student.branch || 'unknown'} is not allowed for this drive`);
    }
  }

  // --- CGPA -------------------------------------------------------------
  const minCgpa = num(rules.minCgpa);
  if (minCgpa > 0) {
    const cgpa = numOrNull(student.education?.graduation?.cgpa);
    if (cgpa !== null && cgpa >= minCgpa) {
      summary.push(`CGPA ${cgpa} (required ${minCgpa})`);
    } else {
      reasons.push(
        cgpa === null
          ? `CGPA is required (minimum ${minCgpa})`
          : `CGPA ${cgpa} is below the required ${minCgpa}`
      );
    }
  }

  // --- 10th -------------------------------------------------------------
  const minTenth = num(rules.minTenthPercentage);
  if (minTenth > 0) {
    const tenth = numOrNull(student.education?.tenth?.percentage);
    if (tenth !== null && tenth >= minTenth) {
      summary.push(`10th: ${tenth}% (required ${minTenth}%)`);
    } else {
      reasons.push(
        tenth === null
          ? `10th percentage is required (minimum ${minTenth}%)`
          : `10th percentage ${tenth}% is below the required ${minTenth}%`
      );
    }
  }

  // --- 12th / Diploma (which one depends on the student's own record) ---
  const minTwelfth = num(rules.minTwelfthPercentage);
  if (minTwelfth > 0) {
    const isDiploma = student.education?.twelfthOrDiploma === 'diploma';
    const source = isDiploma ? student.education?.diploma : student.education?.twelfth;
    const value = numOrNull(source?.percentage);
    const label = isDiploma ? 'Diploma' : '12th';

    if (value !== null && value >= minTwelfth) {
      summary.push(`${label}: ${value}% (required ${minTwelfth}%)`);
    } else {
      reasons.push(
        value === null
          ? `${label} percentage is required (minimum ${minTwelfth}%)`
          : `${label} percentage ${value}% is below the required ${minTwelfth}%`
      );
    }
  }

  // --- Backlogs ---------------------------------------------------------
  const maxActive = num(rules.maxActiveBacklogs);
  if (maxActive >= 0) {
    const active = numOrNull(student.education?.graduation?.backlogs?.active);
    const value = active === null ? 0 : active;
    if (value <= maxActive) {
      if (maxActive > 0) summary.push(`Active backlogs: ${value} (max ${maxActive})`);
    } else {
      reasons.push(`${value} active backlog(s) exceed the allowed ${maxActive}`);
    }
  }

  const maxHistory = num(rules.maxHistoryBacklogs);
  if (maxHistory > 0) {
    const history = numOrNull(student.education?.graduation?.backlogs?.history);
    const value = history === null ? 0 : history;
    if (value <= maxHistory) {
      summary.push(`History backlogs: ${value} (max ${maxHistory})`);
    } else {
      reasons.push(`${value} historical backlog(s) exceed the allowed ${maxHistory}`);
    }
  }

  // --- Gap years --------------------------------------------------------
  const maxGap = num(rules.maxGapYears);
  if (maxGap > 0) {
    const gap = numOrNull(student.education?.graduation?.gapYears);
    const value = gap === null ? 0 : gap;
    if (value <= maxGap) {
      summary.push(`Gap years: ${value} (max ${maxGap})`);
    } else {
      reasons.push(`${value} year(s) of gap exceed the allowed ${maxGap}`);
    }
  }

  return { eligible: reasons.length === 0, reasons, summary };
};

/**
 * Students who may be notified about a drive. Restricted to accounts that
 * actually exist, so no email is ever generated for an orphaned profile.
 */
const findEligibleStudents = async (drive, { excludeApplied = false } = {}) => {
  const students = await Student.find({}).select(
    'userId name email branch rollNo supersetId verificationStatus education appliedDriveIds'
  );

  const eligible = students.filter((student) => evaluate(student, drive).eligible);

  if (!excludeApplied) return eligible;

  const driveId = drive._id.toString();
  return eligible.filter((student) => {
    const applied = Array.isArray(student.appliedDriveIds) ? student.appliedDriveIds : [];
    return !applied.includes(driveId);
  });
};

/**
 * Eligible students who have NOT applied. Used by the deadline reminder so
 * it can never target somebody who already applied.
 */
const findEligibleStudentsNotApplied = async (drive) => {
  const driveId = drive._id.toString();

  const applications = await Application.find({ driveId: drive._id })
    .select('studentId')
    .lean();

  const appliedIds = new Set(applications.map((a) => a.studentId.toString()));

  const candidates = await findEligibleStudents(drive);
  return candidates.filter((student) => !appliedIds.has(student._id.toString()));
};

/**
 * Applicants for a drive. Used when a drive is cancelled or updated so only
 * people with a stake in it are notified.
 */
const findApplicants = async (drive) => {
  const applications = await Application.find({ driveId: drive._id }).lean();
  if (!applications.length) return [];

  const studentIds = applications.map((a) => a.studentId);
  return Student.find({ _id: { $in: studentIds } });
};

/** Recalculates and stores the eligible head-count on the drive. */
const refreshEligibleCount = async (drive) => {
  try {
    const eligible = await findEligibleStudents(drive);
    await PlacementDrive.findByIdAndUpdate(drive._id, {
      $set: { totalEligibleStudentsCount: eligible.length },
    });
    return eligible.length;
  } catch (error) {
    console.error('[eligibility] Failed to refresh eligible count:', error.message);
    return null;
  }
};

module.exports = {
  evaluate,
  findEligibleStudents,
  findEligibleStudentsNotApplied,
  findApplicants,
  refreshEligibleCount,
};