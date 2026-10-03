const {
  layout,
  textLayout,
  detailTable,
  callout,
  greeting,
  escapeHtml,
  portalUrl,
  formatDate,
  PORTAL_NAME,
} = require('../layout');

/** Coordinator: a new or resubmitted profile is waiting for review. */
const profilePendingReview = ({
  coordinatorName,
  studentName,
  studentIdentifier,
  branch,
  batchYear,
  isResubmission,
}) => ({
  subject: isResubmission
    ? 'Student Profile Resubmitted for Verification'
    : 'New Student Profile Pending Verification',
  priority: isResubmission ? 'LOW' : 'NORMAL',
  html: layout({
    title: isResubmission
      ? 'A student profile was resubmitted'
      : 'A new student profile is pending verification',
    preheader: `${studentName} is awaiting profile verification.`,
    bodyHtml: `
      <p style="margin:0 0 14px 0;">Hello ${escapeHtml(coordinatorName || 'Coordinator')},</p>
      <p style="margin:0 0 14px 0;">${
        isResubmission
          ? 'A student has corrected their profile and resubmitted it for review.'
          : 'A newly registered student has submitted their profile for verification.'
      }</p>
      ${detailTable([
        ['Student', studentName],
        ['Superset ID', studentIdentifier],
        ['Branch', branch],
        ['Batch year', batchYear],
      ])}
      ${callout('Review the profile and record a decision so the student is notified automatically.', 'info')}
    `,
    cta: { label: 'Review profile', url: portalUrl('/app') },
    footerNote: 'Sent to the placement coordination team.',
  }),
  text: textLayout({
    title: 'Profile pending verification',
    lines: [
      `Hello ${coordinatorName || 'Coordinator'},`,
      `${studentName} (${studentIdentifier}) has ${isResubmission ? 'resubmitted their profile' : 'submitted a profile'} for verification.`,
      [`Branch: ${branch}`, `Batch year: ${batchYear}`],
      `Review it in the portal: ${portalUrl('/app')}`,
    ],
  }),
});

/** Student: profile approved. */
const profileVerified = ({ studentName, studentIdentifier }) => ({
  subject: 'Profile Verified',
  priority: 'HIGH',
  html: layout({
    title: 'Your profile has been verified',
    preheader: 'You can now apply to eligible placement drives.',
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">Congratulations — the placement coordinator has verified your profile.</p>
      ${detailTable([['Superset ID', studentIdentifier]])}
      <p style="margin:0 0 10px 0;font-weight:600;color:#0f172a;">What you can do now</p>
      <ul style="margin:0 0 16px 0;padding-left:20px;color:#334155;">
        <li style="margin-bottom:6px;">Browse all placement drives you are eligible for.</li>
        <li style="margin-bottom:6px;">Apply with a single click using one of your uploaded resumes.</li>
        <li>Track every application's progress stage by stage.</li>
      </ul>
      ${callout('Keep your profile accurate and up to date — eligibility for each drive is calculated from it.', 'info')}
    `,
    cta: { label: 'Browse placement drives', url: portalUrl('/app') },
  }),
  text: textLayout({
    title: 'Your profile has been verified',
    lines: [
      `Hi ${studentName},`,
      'Congratulations — the placement coordinator has verified your profile.',
      `Superset ID: ${studentIdentifier}`,
      'You can now browse and apply to every drive you are eligible for.',
    ],
    cta: { label: 'Browse placement drives', url: portalUrl('/app') },
  }),
});

/** Student: profile rejected. Always carries the coordinator's reason. */
const profileRejected = ({ studentName, studentIdentifier, reason }) => {
  const hasReason = Boolean(reason && String(reason).trim());
  return {
    subject: 'Profile Verification Rejected',
    priority: 'HIGH',
    html: layout({
      title: 'Your profile could not be verified',
      preheader: 'The placement coordinator has asked for corrections to your profile.',
      bodyHtml: `
        ${greeting(studentName)}
        <p style="margin:0 0 14px 0;">The placement coordinator has reviewed your profile and it could not be verified at this time.</p>
        ${
          hasReason
            ? `<div style="margin:18px 0;padding:15px;background:#fef2f2;border-left:3px solid #fecaca;border-radius:6px;">
                 <p style="margin:0 0 6px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#991b1b;font-weight:700;">Coordinator's remarks</p>
                 <p style="margin:0;font-size:14px;line-height:1.6;color:#7f1d1d;">${escapeHtml(reason)}</p>
               </div>`
            : callout('No specific remarks were recorded. Please review your profile for incomplete or incorrect entries.', 'warn')
        }
        <p style="margin:0 0 10px 0;font-weight:600;color:#0f172a;">What to do next</p>
        <ol style="margin:0 0 16px 0;padding-left:20px;color:#334155;">
          <li style="margin-bottom:6px;">Open your profile and correct the fields mentioned above.</li>
          <li style="margin-bottom:6px;">Re-upload any documents that were unclear, incomplete or illegible.</li>
          <li>Resubmit your profile for verification.</li>
        </ol>
        ${detailTable([['Superset ID', studentIdentifier]])}
        ${callout('If you believe this is a mistake, contact the placement cell before resubmitting.', 'info')}
      `,
      cta: { label: 'Correct and resubmit profile', url: portalUrl('/app') },
    }),
    text: textLayout({
      title: 'Your profile could not be verified',
      lines: [
        `Hi ${studentName},`,
        'The placement coordinator could not verify your profile.',
        hasReason ? `Coordinator's remarks: ${reason}` : 'No specific remarks were recorded.',
        'Correct the fields above, re-upload any unclear documents, then resubmit for verification.',
      ],
      cta: { label: 'Correct and resubmit profile', url: portalUrl('/app') },
    }),
  };
};

/** Student: coordinator sent the profile back for correction. */
const correctionRequired = ({ studentName, remarks, section }) => ({
  subject: 'Profile Correction Required',
  priority: 'HIGH',
  html: layout({
    title: 'Your profile needs correction',
  preheader: 'The placement coordinator has requested changes to your profile.',
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">The placement coordinator has reviewed your profile and needs some information corrected before it can be verified.</p>
      ${detailTable([['Section', section]])}
      ${
        remarks
          ? `<div style="margin:18px 0;padding:15px;background:#fffbeb;border-left:3px solid #fde68a;border-radius:6px;">
               <p style="margin:0 0 6px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#92400e;font-weight:700;">Coordinator's remarks</p>
               <p style="margin:0;font-size:14px;line-height:1.6;color:#78350f;">${escapeHtml(remarks)}</p>
             </div>`
          : ''
      }
      <p style="margin:0;">Make the corrections and resubmit your profile for verification.</p>
    `,
    cta: { label: 'Update my profile', url: portalUrl('/app') },
    footerNote: 'Your profile stays editable until it is verified.',
  }),
  text: textLayout({
    title: 'Your profile needs correction',
    lines: [
      `Hi ${studentName},`,
      'The placement coordinator has requested corrections to your profile before verification.',
      section ? `Section: ${section}` : '',
      remarks ? `Remarks: ${remarks}` : '',
      'Make the corrections and resubmit for verification.',
    ],
    cta: { label: 'Update my profile', url: portalUrl('/app') },
  }),
});

/** Student: confirmation that a resubmission went through. */
const profileResubmitted = ({ studentName, studentIdentifier }) => ({
  subject: 'Profile Resubmitted Successfully',
  priority: 'LOW',
  html: layout({
    title: 'Profile resubmitted',
    preheader: 'Your profile is back with the placement coordinator for review.',
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">Your profile has been resubmitted and is now back with the placement coordinator for review.</p>
      ${detailTable([
        ['Superset ID', studentIdentifier],
        ['Submitted on', formatDate(new Date())],
      ])}
      ${callout('You will be notified by email as soon as a decision is recorded. No further action is needed from you right now.', 'info')}
    `,
    cta: { label: 'View my profile', url: portalUrl('/app') },
  }),
  text: textLayout({
    title: 'Profile resubmitted',
    lines: [
      `Hi ${studentName},`,
      'Your profile has been resubmitted and is with the placement coordinator for review.',
      `Superset ID: ${studentIdentifier}`,
      'You will be notified by email once a decision is recorded.',
    ],
    cta: { label: 'View my profile', url: portalUrl('/app') },
  }),
});

module.exports = {
  profilePendingReview,
  profileVerified,
  profileRejected,
  correctionRequired,
  profileResubmitted,
};