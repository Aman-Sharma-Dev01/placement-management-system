/**
 * Central template registry.
 *
 * Controllers never build HTML. They pick an event constant and hand the
 * template a data object. Adding a provider (SES, Postmark) means changing
 * the transport only — these templates stay as they are.
 */
const authTemplates = require('./auth');
const studentTemplates = require('./student');
const placementTemplates = require('./placement');
const applicationTemplates = require('./application');
const interviewTemplates = require('./interview');
const adminTemplates = require('./admin');

const TEMPLATES = {
  // --- Account / auth ---------------------------------------------------
  ACCOUNT_WELCOME: authTemplates.welcome,
  PASSWORD_RESET_REQUEST: authTemplates.passwordReset,
  PASSWORD_CHANGED: authTemplates.passwordChanged,

  // --- Profile / verification ------------------------------------------
  PROFILE_PENDING_REVIEW: studentTemplates.profilePendingReview,
  PROFILE_VERIFIED: studentTemplates.profileVerified,
  PROFILE_REJECTED: studentTemplates.profileRejected,
  PROFILE_CORRECTION_REQUIRED: studentTemplates.correctionRequired,
  PROFILE_RESUBMITTED: studentTemplates.profileResubmitted,

  // --- Placement drives -------------------------------------------------
  NEW_JOB_ELIGIBLE: placementTemplates.newJob,
  DRIVE_UPDATED: placementTemplates.driveUpdated,
  DRIVE_CLOSED: placementTemplates.driveClosed,
  DEADLINE_REMINDER: placementTemplates.deadlineReminder,

  // --- Applications -----------------------------------------------------
  APPLICATION_SUBMITTED: applicationTemplates.applicationSubmitted,
  APPLICATION_STAGE_UPDATED: applicationTemplates.stageUpdate,
  APPLICATION_SHORTLISTED: applicationTemplates.shortlisted,
  APPLICATION_SELECTED: applicationTemplates.selected,

  // --- Hiring rounds ----------------------------------------------------
  INTERVIEW_SCHEDULED: interviewTemplates.scheduled,
  INTERVIEW_REMINDER: interviewTemplates.reminder,
  INTERVIEW_CANCELLED: interviewTemplates.cancelled,

  // --- Admin / system ---------------------------------------------------
  SYSTEM_ALERT: adminTemplates.systemAlert,
  OPERATIONAL_DIGEST: adminTemplates.operationalDigest,
};

/**
 * Renders a template by event key.
 * Throws on an unknown key so a typo fails loudly in development instead of
 * silently sending nothing.
 */
const renderTemplate = (eventType, data = {}) => {
  const template = TEMPLATES[eventType];
  if (!template) {
    throw new Error(`Unknown email template: ${eventType}`);
  }

  const rendered = template(data);

  if (!rendered || !rendered.subject || !rendered.html || !rendered.text) {
    throw new Error(`Template ${eventType} did not return a complete email`);
  }

  return rendered;
};

/** Event keys that bypass user email preferences and always send. */
const SECURITY_EVENTS = [
  'PASSWORD_RESET_REQUEST',
  'PASSWORD_CHANGED',
  'ACCOUNT_WELCOME',
];

const isSecurityEvent = (eventType) => SECURITY_EVENTS.includes(eventType);

/**
 * Default email priority per event, used when a caller does not pass one.
 * LOW and NORMAL events still create in-app notifications.
 */
const PRIORITY = {
  ACCOUNT_WELCOME: 'HIGH',
  PASSWORD_RESET_REQUEST: 'CRITICAL',
  PASSWORD_CHANGED: 'CRITICAL',

  PROFILE_PENDING_REVIEW: 'NORMAL',
  PROFILE_VERIFIED: 'HIGH',
  PROFILE_REJECTED: 'HIGH',
  PROFILE_CORRECTION_REQUIRED: 'HIGH',
  PROFILE_RESUBMITTED: 'LOW',

  NEW_JOB_ELIGIBLE: 'HIGH',
  DRIVE_UPDATED: 'NORMAL',
  DRIVE_CLOSED: 'HIGH',
  DEADLINE_REMINDER: 'NORMAL',

  APPLICATION_SUBMITTED: 'LOW',
  APPLICATION_STAGE_UPDATED: 'NORMAL',
  APPLICATION_SHORTLISTED: 'HIGH',
  APPLICATION_SELECTED: 'CRITICAL',

  INTERVIEW_SCHEDULED: 'NORMAL',
  INTERVIEW_REMINDER: 'NORMAL',
  INTERVIEW_CANCELLED: 'HIGH',

  SYSTEM_ALERT: 'CRITICAL',
  OPERATIONAL_DIGEST: 'NORMAL',
};

module.exports = {
  renderTemplate,
  isSecurityEvent,
  PRIORITY,
  TEMPLATES,
  SECURITY_EVENTS,
};