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

  // --- Gender ------------------------------------------------------------
  // An empty allow-list means the drive is open to every gender. Otherwise
  // only the listed genders (e.g. a "female only" hiring drive) match.
  const allowedGenders = Array.isArray(rules.allowedGenders) ? rules.allowedGenders : [];
  if (allowedGenders.length) {
    if (student.gender && allowedGenders.includes(student.gender)) {
      summary.push(`Gender: ${student.gender}`);
    } else {
      reasons.push(
        student.gender
          ? `This drive is open only to ${allowedGenders.join(', ')} candidates`
          : `Your gender is not set on your profile, so you cannot be matched against this drive`
      );
    }
  }

  // --- Batch / admission year --------------------------------------------
  // targetBatchIds takes priority when present; fall back to allowedBatchYears.
  const targetBatchIds = Array.isArray(rules.targetBatchIds) ? rules.targetBatchIds : [];
  const allowedBatches = Array.isArray(rules.allowedBatchYears)
    ? rules.allowedBatchYears
    : Array.isArray(rules.allowedBatches)
    ? rules.allowedBatches
    : [];

  if (targetBatchIds.length) {
    // Student must be enrolled in one of the target batches
    const studentBatchId = student.enrolledBatchId?.toString();
    const matches =
      studentBatchId &&
      targetBatchIds.some((id) => id.toString() === studentBatchId);
    if (matches) {
      summary.push(`Enrolled batch matched`);
    } else {
      reasons.push(
        student.batchEnrollmentStatus !== 'enrolled'
          ? 'You are not enrolled in a placement batch'
          : 'Your enrolled batch is not eligible for this drive'
      );
    }
  } else if (allowedBatches.length) {
    const studentBatch = numOrNull(student.batchYear);
    const matches = studentBatch !== null && allowedBatches.includes(studentBatch);
    if (matches) {
      summary.push(`Batch: ${studentBatch}`);
    } else {
      reasons.push(
        `Your batch (${student.batchYear || 'not set'}) is not eligible for this drive`
      );
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
    'userId name email branch rollNo supersetId verificationStatus education appliedDriveIds batchYear gender enrolledBatchId batchEnrollmentStatus'
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

/**
 * The Mongo condition that selects the drives a student is allowed to see
 * based on gender.
 *
 * A drive restricted to a gender (e.g. a female-only hiring drive) is only
 * visible to students of that gender. An empty or missing allow-list means the
 * drive is open to everybody — that includes drives created before the gender
 * rule existed, which have no allow-list at all.
 */
const genderVisibilityFilter = (gender) => {
  const openToEverybody = [
    { 'eligibility.allowedGenders': { $exists: false } },
    { 'eligibility.allowedGenders': { $size: 0 } },
  ];

  if (!gender) return { $or: openToEverybody };

  return {
    $or: [...openToEverybody, { 'eligibility.allowedGenders': gender }],
  };
};

/**
 * The Mongo condition that selects the drives a student is allowed to see
 * based on batch year.
 *
 * If a drive has a non-empty `allowedBatchYears` list, only students whose
 * `batchYear` is in that list can see it. An empty or missing list means the
 * drive is open to all batches.
 */
const batchYearVisibilityFilter = (batchYear) => {
  const openToAllBatches = [
    { 'eligibility.allowedBatchYears': { $exists: false } },
    { 'eligibility.allowedBatchYears': { $size: 0 } },
  ];

  if (!batchYear) return { $or: openToAllBatches };

  return {
    $or: [...openToAllBatches, { 'eligibility.allowedBatchYears': batchYear }],
  };
};

/**
 * Combined batch visibility filter that handles both targetBatchIds (new)
 * and allowedBatchYears (legacy).
 *
 * A drive is visible to a student when ANY of these is true:
 *   1. The drive has no targetBatchIds AND no allowedBatchYears (open to all)
 *   2. The drive has targetBatchIds and the student's enrolledBatchId matches
 *   3. The drive has allowedBatchYears and the student's batchYear matches
 */
const batchEnrollmentVisibilityFilter = (batchYear, enrolledBatchId) => {
  const noBatchRestriction = {
    $and: [
      { $or: [{ 'eligibility.targetBatchIds': { $exists: false } }, { 'eligibility.targetBatchIds': { $size: 0 } }] },
      { $or: [{ 'eligibility.allowedBatchYears': { $exists: false } }, { 'eligibility.allowedBatchYears': { $size: 0 } }] },
    ],
  };

  const conditions = [noBatchRestriction];

  if (enrolledBatchId) {
    conditions.push({ 'eligibility.targetBatchIds': enrolledBatchId });
  }
  if (batchYear) {
    conditions.push({
      $and: [
        { $or: [{ 'eligibility.targetBatchIds': { $exists: false } }, { 'eligibility.targetBatchIds': { $size: 0 } }] },
        { 'eligibility.allowedBatchYears': batchYear },
      ],
    });
  }

  return { $or: conditions };
};

module.exports = {
  evaluate,
  findEligibleStudents,
  findEligibleStudentsNotApplied,
  findApplicants,
  refreshEligibleCount,
  genderVisibilityFilter,
  batchYearVisibilityFilter,
  batchEnrollmentVisibilityFilter,
};

