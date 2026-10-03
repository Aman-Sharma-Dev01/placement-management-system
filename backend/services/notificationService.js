const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');
const { PRIORITY, isSecurityEvent } = require('../emailTemplates');
const { describeChange } = require('../emailTemplates/layout');

/**
 * Notification orchestrator.
 *
 * This is the only place allowed to create notifications or trigger email.
 * Controllers call `notify*` helpers and never touch Nodemailer, templates or
 * the queue directly.
 *
 * Guarantees:
 *  - Never throws. A notification failure can never fail the business action
 *    that triggered it.
 *  - Idempotent. `eventKey` is unique+sparse on Notification, so a double
 *    click, a retried request or a server restart cannot produce a second
 *    notification or a second email.
 *  - Respects RBAC. Recipient lists are built here from role, not from the
 *    caller's payload.
 */

const OPT_OUT_CATEGORIES = {
  // eventType prefixes a user can mute
  NEW_JOB: 'jobs',
  DEADLINE: 'jobs',
  DRIVE_: 'jobs',
  APPLICATION_: 'applications',
  INTERVIEW_: 'interviews',
  PROFILE_: 'profile',
};

const categoryFor = (eventType) => {
  const key = Object.keys(OPT_OUT_CATEGORIES).find((prefix) => eventType.startsWith(prefix));
  return key ? OPT_OUT_CATEGORIES[key] : null;
};

/**
 * User preference check. Security emails are never suppressible.
 */
const shouldEmail = (user, eventType) => {
  if (isSecurityEvent(eventType)) return true;
  if (!user) return true;

  const prefs = user.notificationPreferences || {};
  if (prefs.emailNotificationsEnabled === false) return false;

  const category = categoryFor(eventType);
  if (category && Array.isArray(prefs.mutedCategories)) {
    if (prefs.mutedCategories.includes(category)) return false;
  }
  return true;
};

/**
 * Core dispatch.
 *
 * @param {object} params
 * @param {string} params.eventType       template key
 * @param {object} params.recipients      [{ userId, email, name }]
 * @param {string} params.eventKey        idempotency key — required
 * @param {string} params.title           in-app title
 * @param {string} params.message         in-app message
 * @param {string} [params.type]          notification type
 * @param {string} [params.priority]      LOW | NORMAL | HIGH | CRITICAL
 * @param {string} [params.targetRole]    role broadcast instead of userId
 * @param {object} [params.data]          template variables (per recipient)
 * @param {object} [params.dataByUserId]  per-recipient template variables
 * @param {string} [params.entityType]
 * @param {string} [params.entityId]
 * @param {string} [params.linkDriveId]
 */
const dispatch = async ({
  eventType,
  recipients = [],
  eventKey,
  title,
  message,
  type = 'drive',
  priority,
  targetRole = null,
  data = {},
  dataByUserId = {},
  entityType = '',
  entityId = '',
  linkDriveId = '',
}) => {
  if (!eventKey) {
    console.error(`[notificationService] eventKey is required for ${eventType} — skipping`);
    return [];
  }
  if (!Array.isArray(recipients) || !recipients.length) {
    return [];
  }

  const resolvedPriority = priority || PRIORITY[eventType] || 'NORMAL';

  // De-duplicate: same email can arrive via a linked user record twice.
  const seen = new Set();
  const uniqueRecipients = recipients.filter((recipient) => {
    const key = String(recipient?.email || '').toLowerCase() || String(recipient?.userId || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const created = [];

  for (const recipient of uniqueRecipients) {
    try {
      // ---- In-app channel -------------------------------------------
      // Unique index on eventKey makes this the dedupe point: if the event was
      // already processed, the insert throws and no email is queued.
      const notification = await Notification.create({
        userId: recipient.userId || null,
        targetRole,
        title,
        message,
        type,
        priority: resolvedPriority,
        eventKey: `${eventKey}:${recipient.userId || targetRole || recipient.email}`,
        entityType,
        entityId,
        linkDriveId,
      });

      created.push(notification);

      // ---- Email channel --------------------------------------------
      let user = null;
      if (recipient.userId) {
        user = await User.findById(recipient.userId).select('notificationPreferences');
      }

      if (!shouldEmail(user, eventType)) {
        notification.emailError = 'suppressed by user preference';
        await notification.save();
        continue;
      }

      if (!recipient.email) {
        notification.emailError = 'no email address on file';
        await notification.save();
        console.warn(`[notificationService] ${eventType}: no email for user ${recipient.userId}`);
        continue;
      }

      const templateData = dataByUserId[recipient.userId] || data;

      await emailService.send({
        eventType,
        recipient: {
          email: recipient.email,
          name: recipient.name,
          userId: recipient.userId,
        },
        data: templateData,
        notificationId: notification._id,
        entityType,
        entityId,
      });
    } catch (error) {
      // Duplicate key == event already handled. Expected under retries.
      if (error?.code === 11000) {
        continue;
      }
      console.error(`[notificationService] ${eventType} failed for one recipient:`, error.message);
    }
  }

  return created;
};

/** Role broadcast. Used for operational events, never for student data. */
const dispatchToRole = async ({ eventType, role, eventKey, title, message, type = 'system', priority, entityType = '', entityId = '', linkDriveId = '' }) => {
  try {
    const users = await User.find({ role }).select('email name _id notificationPreferences');
    if (!users.length) return [];

    return await dispatch({
      eventType,
      recipients: users.map((user) => ({ userId: user._id, email: user.email, name: user.name })),
      eventKey,
      title,
      message,
      type,
      priority,
      data: { recipientName: 'there' },
      entityType,
      entityId,
      linkDriveId,
    });
  } catch (error) {
    console.error(`[notificationService] role broadcast to ${role} failed:`, error.message);
    return [];
  }
};

/* ------------------------------------------------------------------ */
/*  Domain helpers. Each one owns its eventKey shape and priority.      */
/* ------------------------------------------------------------------ */

/** Account created. Security-class: always emailed. */
const accountWelcome = async (user) =>
  dispatch({
    eventType: 'ACCOUNT_WELCOME',
    recipients: [{ userId: user._id, email: user.email, name: user.name }],
    eventKey: `account:${user._id}:welcome`,
    title: 'Welcome to the placement portal',
    message: 'Your account is ready. Complete your profile to apply for placements.',
    type: 'account',
    entityType: 'user',
    entityId: user._id.toString(),
    data: { name: user.name, email: user.email },
  });

/** Password reset requested. Always emailed, never reveals account existence. */
const passwordResetRequest = async (user, resetUrl, expiresInMinutes) =>
  dispatch({
    eventType: 'PASSWORD_RESET_REQUEST',
    recipients: [{ userId: user._id, email: user.email, name: user.name }],
    eventKey: `account:${user._id}:pwreset:${Date.now()}`,
    title: 'Password Reset Request',
    message: 'A password reset link was sent to your email address.',
    type: 'account',
    entityType: 'user',
    entityId: user._id.toString(),
    data: { name: user.name, resetUrl, expiresInMinutes },
  });

const passwordChanged = async (user) =>
  dispatch({
    eventType: 'PASSWORD_CHANGED',
    recipients: [{ userId: user._id, email: user.email, name: user.name }],
    eventKey: `account:${user._id}:pwchanged:${Date.now()}`,
    title: 'Your password has been reset successfully',
    message: 'Your account password was changed. If this was not you, reset it immediately.',
    type: 'account',
    entityType: 'user',
    entityId: user._id.toString(),
    data: { name: user.name, changedAt: new Date() },
  });

/** Coordinator is told a profile is waiting. */
const profilePendingReview = async ({ student, isResubmission = false }) => {
  const coordinators = await User.find({ role: 'placement_coordinator' }).select('email name _id');
  if (!coordinators.length) return [];

  return dispatch({
    eventType: 'PROFILE_PENDING_REVIEW',
    recipients: coordinators.map((user) => ({ userId: user._id, email: user.email, name: user.name })),
    eventKey: `verification:${student._id}:${isResubmission ? 'resubmitted' : 'submitted'}:${student.updatedAt?.getTime?.() || Date.now()}`,
    title: isResubmission ? 'Profile resubmitted for verification' : 'New profile pending verification',
    message: `${student.name} (${student.rollNo}) has ${isResubmission ? 'resubmitted their profile' : 'submitted a profile'} for verification.`,
    type: 'verification',
    entityType: 'student',
    entityId: student._id.toString(),
    data: {
      coordinatorName: '',
      studentName: student.name,
      studentIdentifier: student.supersetId || student.rollNo,
      branch: student.branch,
      batchYear: student.batchYear,
      isResubmission,
    },
  });
};

/** Student-facing verification outcomes. */
const profileDecision = async ({ student, status, remarks = '' }) => {
  const studentIdentifier = student.supersetId || student.rollNo;
  const base = {
    recipients: [{ userId: student.userId, email: student.email, name: student.name }],
    entityType: 'student',
    entityId: student._id.toString(),
  };

  // Remarks are part of the key so a genuine follow-up decision re-notifies,
  // while a duplicate identical request does not.
  const remarkKey = Buffer.from(String(remarks || '')).toString('base64').slice(0, 24);

  if (status === 'verified') {
    return dispatch({
      ...base,
      eventType: 'PROFILE_VERIFIED',
      eventKey: `verification:${student._id}:verified:${remarkKey}`,
      title: 'Profile Verified',
      message: 'Your profile has been verified. You can now apply to eligible placement drives.',
      type: 'verification',
      data: { studentName: student.name, studentIdentifier },
    });
  }

  if (status === 'rejected') {
    return dispatch({
      ...base,
      eventType: 'PROFILE_REJECTED',
      eventKey: `verification:${student._id}:rejected:${remarkKey}`,
      title: 'Profile Verification Rejected',
      message: remarks || 'Your profile could not be verified. Please review and resubmit.',
      type: 'verification',
      data: { studentName: student.name, studentIdentifier, reason: remarks },
    });
  }

  if (status === 'draft') {
    return dispatch({
      ...base,
      eventType: 'PROFILE_CORRECTION_REQUIRED',
      eventKey: `verification:${student._id}:correction:${remarkKey}`,
      title: 'Profile Correction Required',
      message: remarks || 'The placement coordinator has requested corrections to your profile.',
      type: 'verification',
      data: { studentName: student.name, remarks, section: '' },
    });
  }

  // 'pending' -> back in review, in-app only (LOW priority).
  return dispatch({
    ...base,
    eventType: 'PROFILE_RESUBMITTED',
    eventKey: `verification:${student._id}:pending:${remarkKey}`,
    title: 'Profile submitted for verification',
    message: 'Your profile has been submitted and is with the placement coordinator.',
    type: 'verification',
    priority: 'LOW',
    data: { studentName: student.name, studentIdentifier },
  });
};

/** New drive -> only students the eligibility engine actually matches. */
const newJobForEligible = async ({ drive, students, eligibilityByStudent = {} }) => {
  // Only a userId is required: the in-app channel works without an email
  // address, and dispatch records the missing address instead of skipping the
  // student entirely.
  const recipients = students
    .filter((student) => student.userId)
    .map((student) => ({ userId: student.userId, email: student.email, name: student.name }));

  if (!recipients.length) return [];

  return dispatch({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipients,
    eventKey: `drive:${drive._id}:published`,
    title: `New Placement Opportunity: ${drive.companyName}`,
    message: `${drive.companyName} has opened applications for ${drive.jobTitle}.`,
    type: 'drive',
    entityType: 'drive',
    entityId: drive._id.toString(),
    linkDriveId: drive._id.toString(),
    // Per-student eligibility summary, so nobody is told a requirement they
    // do not actually satisfy.
    dataByUserId: students.reduce((acc, student) => {
      acc[student.userId.toString()] = {
        studentName: student.name,
        companyName: drive.companyName,
        jobTitle: drive.jobTitle,
        positionType: drive.positionType,
        workMode: drive.workMode,
        location: drive.location,
        ctcLpa: drive.ctcLpa,
        stipendMonthly: drive.stipendMonthly,
        deadlineDate: drive.deadlineDate,
        eligibilitySummary: eligibilityByStudent[student._id.toString()]?.summary || [],
      };
      return acc;
    }, {}),
    data: {
      studentName: '',
      companyName: drive.companyName,
      jobTitle: drive.jobTitle,
      positionType: drive.positionType,
      workMode: drive.workMode,
      location: drive.location,
      ctcLpa: drive.ctcLpa,
      stipendMonthly: drive.stipendMonthly,
      deadlineDate: drive.deadlineDate,
    },
  });
};

/** Drive changed materially -> notify applicants (and newly eligible students). */
const driveUpdated = async ({ drive, changes = [], applicants = [], newlyEligible = [] }) => {
  const studentById = new Map();
  [...applicants, ...newlyEligible].forEach((student) => {
    if (student?.userId) studentById.set(student._id.toString(), student);
  });

  const recipients = [...studentById.values()]
    .filter((student) => student.userId)
    .map((student) => ({ userId: student.userId, email: student.email, name: student.name }));

  if (!recipients.length || !changes.length) return [];

  // The idempotency key must describe the real change, so it is built from the
  // same normalised `before -> after` text the recipient reads.
  const changeSignature = changes
    .map((c) => describeChange(c))
    .join('|')
    .slice(0, 120);

  return dispatch({
    eventType: 'DRIVE_UPDATED',
    recipients,
    eventKey: `drive:${drive._id}:updated:${changeSignature}`,
    title: `Placement Drive Updated: ${drive.companyName}`,
    message: `Details for ${drive.jobTitle} at ${drive.companyName} have changed: ${changes
      .map((c) => describeChange(c))
      .join(', ')}`,
    type: 'drive',
    entityType: 'drive',
    entityId: drive._id.toString(),
    linkDriveId: drive._id.toString(),
    dataByUserId: [...studentById.values()].reduce((acc, student) => {
      acc[student.userId.toString()] = {
        studentName: student.name,
        companyName: drive.companyName,
        jobTitle: drive.jobTitle,
        changes,
      };
      return acc;
    }, {}),
    data: { studentName: '', companyName: drive.companyName, jobTitle: drive.jobTitle, changes },
  });
};

/** Drive closed/cancelled -> applicants, plus optionally eligible students. */
const driveClosed = async ({ drive, reason = '', wasCancelled = true, applicants = [], eligibleStudents = [] }) => {
  const everyone = new Map();
  applicants.forEach((student) => student?.userId && everyone.set(student._id.toString(), student));
  eligibleStudents.forEach((student) => student?.userId && everyone.set(student._id.toString(), student));

  const recipients = [...everyone.values()]
    .filter((student) => student.userId)
    .map((student) => ({ userId: student.userId, email: student.email, name: student.name }));

  if (!recipients.length) return [];

  return dispatch({
    eventType: 'DRIVE_CLOSED',
    recipients,
    eventKey: `drive:${drive._id}:${wasCancelled ? 'cancelled' : 'closed'}`,
    title: `Placement Drive ${wasCancelled ? 'Cancelled' : 'Closed'}: ${drive.companyName}`,
    message: wasCancelled
      ? `The ${drive.jobTitle} drive at ${drive.companyName} has been cancelled.`
      : `Applications for ${drive.jobTitle} at ${drive.companyName} have closed.`,
    type: 'drive',
    priority: 'HIGH',
    entityType: 'drive',
    entityId: drive._id.toString(),
    dataByUserId: [...everyone.values()].reduce((acc, student) => {
      // Keyed by userId, because dispatch looks up `dataByUserId[recipient.userId]`.
      acc[student.userId.toString()] = {
        studentName: student.name,
        companyName: drive.companyName,
        jobTitle: drive.jobTitle,
        reason,
        wasCancelled,
      };
      return acc;
    }, {}),
    data: { studentName: '', companyName: drive.companyName, jobTitle: drive.jobTitle, reason, wasCancelled },
  });
};

/** Deadline reminder -> eligible students who have NOT applied. */
const deadlineReminder = async ({ drive, students, hoursLeft }) => {
  const recipients = students
    .filter((student) => student.userId)
    .map((student) => ({ userId: student.userId, email: student.email, name: student.name }));

  if (!recipients.length) return [];

  return dispatch({
    eventType: 'DEADLINE_REMINDER',
    recipients,
    eventKey: `drive:${drive._id}:reminder:${hoursLeft}h`,
    title: `Closing soon: ${drive.companyName}`,
    message: `Applications for ${drive.jobTitle} close in about ${hoursLeft} hours.`,
    type: 'drive',
    entityType: 'drive',
    entityId: drive._id.toString(),
    linkDriveId: drive._id.toString(),
    dataByUserId: students.reduce((acc, student) => {
      // Keyed by userId, because dispatch looks up `dataByUserId[recipient.userId]`.
      acc[student.userId.toString()] = {
        studentName: student.name,
        companyName: drive.companyName,
        jobTitle: drive.jobTitle,
        deadlineDate: drive.deadlineDate,
        hoursLeft,
      };
      return acc;
    }, {}),
    data: {
      studentName: '',
      companyName: drive.companyName,
      jobTitle: drive.jobTitle,
      deadlineDate: drive.deadlineDate,
      hoursLeft,
    },
  });
};

/** Application submitted confirmation. */
const applicationSubmitted = async ({ application, student, drive, resumeName }) =>
  dispatch({
    eventType: 'APPLICATION_SUBMITTED',
    recipients: [{ userId: student.userId, email: student.email, name: student.name }],
    eventKey: `application:${application._id}:submitted`,
    title: `Application Submitted: ${drive.companyName}`,
    message: `Your application for ${drive.jobTitle} at ${drive.companyName} was submitted.`,
    type: 'application',
    priority: 'LOW',
    entityType: 'application',
    entityId: application._id.toString(),
    linkDriveId: drive._id.toString(),
    data: {
      studentName: student.name,
      companyName: drive.companyName,
      jobTitle: drive.jobTitle,
      resumeName,
      appliedAt: application.appliedAt,
      currentStage: application.stageHistory?.[0]?.stageName || 'Application Received',
    },
  });

/** Hiring stage moved. */
const applicationStageChanged = async ({
  application,
  student,
  drive,
  stage,
  status,
  feedback = '',
  feedbackVisibleToStudent = false,
}) => {
  const stageName = stage?.name || 'Workflow Stage';
  const base = {
    recipients: [{ userId: student.userId, email: student.email, name: student.name }],
    entityType: 'application',
    entityId: application._id.toString(),
    linkDriveId: drive._id.toString(),
  };

  if (status === 'offered') {
    return dispatch({
      ...base,
      eventType: 'APPLICATION_SELECTED',
      eventKey: `application:${application._id}:offered:${application.stageHistory?.length || 1}`,
      title: `Congratulations! You Have Been Selected for ${drive.companyName}`,
      message: `You have been selected for ${drive.jobTitle} at ${drive.companyName}.`,
      type: 'offer',
      data: {
        studentName: student.name,
        companyName: drive.companyName,
        jobTitle: drive.jobTitle,
        nextSteps: ['Log in to the portal and check the My Applications section for details.'],
      },
    });
  }

  if (status === 'shortlisted') {
    return dispatch({
      ...base,
      eventType: 'APPLICATION_SHORTLISTED',
      eventKey: `application:${application._id}:shortlisted:${application.stageHistory?.length || 1}`,
      title: `Congratulations! You have been shortlisted for ${drive.companyName}`,
      message: `You have been shortlisted for ${drive.jobTitle} at ${drive.companyName}.`,
      type: 'interview',
      data: { studentName: student.name, companyName: drive.companyName, jobTitle: drive.jobTitle },
    });
  }

  return dispatch({
    ...base,
    eventType: 'APPLICATION_STAGE_UPDATED',
    eventKey: `application:${application._id}:stage:${stage?._id || stageName}:${application.stageHistory?.length || 1}`,
    title: `Application Update: ${drive.companyName}`,
    message: `Your application for ${drive.jobTitle} at ${drive.companyName} is now at "${stageName}".`,
    type: status === 'rejected' ? 'application' : 'interview',
    data: {
      studentName: student.name,
      companyName: drive.companyName,
      jobTitle: drive.jobTitle,
      stageName,
      status,
      // Confidential by default: feedback only leaves the system when the
      // coordinator explicitly marked it student-visible.
      feedback: feedbackVisibleToStudent ? feedback || '' : '',
    },
  });
};

/** A hiring round was scheduled / rescheduled / cancelled. */
const interviewEvent = async ({ application, student, drive, stage, kind, previous = null, reason = '', hiringStopped = false }) => {
  const map = {
    scheduled: { eventType: 'INTERVIEW_SCHEDULED', type: 'interview' },
    rescheduled: { eventType: 'INTERVIEW_SCHEDULED', type: 'interview' },
    reminder: { eventType: 'INTERVIEW_REMINDER', type: 'interview', priority: 'LOW' },
    cancelled: { eventType: 'INTERVIEW_CANCELLED', type: 'interview', priority: 'HIGH' },
  };
  const config = map[kind];
  if (!config) return [];

  const suffix =
    kind === 'cancelled'
      ? `cancelled:${application.stageHistory?.length || 1}`
      : `${stage?._id || stage?.name}:${stage?.scheduledDate || ''}:${kind}`;

  return dispatch({
    eventType: config.eventType,
    recipients: [{ userId: student.userId, email: student.email, name: student.name }],
    eventKey: `application:${application._id}:interview:${suffix}`,
    title:
      kind === 'cancelled'
        ? `Cancelled: ${drive.companyName}`
        : `Application Update: ${drive.companyName}`,
    message:
      kind === 'cancelled'
        ? `Your round for ${drive.jobTitle} at ${drive.companyName} has been cancelled.`
        : `Your round for ${drive.jobTitle} at ${drive.companyName} has been scheduled.`,
    type: config.type,
    priority: config.priority,
    entityType: 'application',
    entityId: application._id.toString(),
    linkDriveId: drive._id.toString(),
    data: {
      studentName: student.name,
      companyName: drive.companyName,
      jobTitle: drive.jobTitle,
      stageType: stage?.type,
      stageName: stage?.name,
      scheduledAt: stage?.scheduledDate,
      venueOrLink: stage?.venueOrLink,
      instructions: stage?.notes,
      previous,
      reason,
      hiringStopped,
    },
  });
};

module.exports = {
  dispatch,
  dispatchToRole,
  accountWelcome,
  passwordResetRequest,
  passwordChanged,
  profilePendingReview,
  profileDecision,
  newJobForEligible,
  driveUpdated,
  driveClosed,
  deadlineReminder,
  applicationSubmitted,
  applicationStageChanged,
  interviewEvent,
};