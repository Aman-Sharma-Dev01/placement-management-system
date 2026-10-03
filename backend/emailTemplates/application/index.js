const {
  layout,
  textLayout,
  detailTable,
  callout,
  greeting,
  escapeHtml,
  portalUrl,
  formatDate,
} = require('../layout');

/** Sent only AFTER the application document is persisted. */
const applicationSubmitted = ({
  studentName,
  companyName,
  jobTitle,
  resumeName,
  appliedAt,
  currentStage,
}) => ({
  subject: `Application Submitted: ${companyName}`,
  priority: 'LOW',
  html: layout({
    title: 'Application submitted',
    preheader: `Your application for ${jobTitle} at ${companyName} went through.`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">Your application was submitted successfully. Good luck.</p>
      ${detailTable([
        ['Company', companyName],
        ['Role', jobTitle],
        ['Resume used', resumeName],
        ['Applied on', formatDate(appliedAt)],
        ['Current stage', currentStage],
      ])}
      ${callout('You can track this application from the My Applications section. You will be emailed at every stage change.', 'info')}
    `,
    cta: { label: 'Track my application', url: portalUrl('/app') },
    footerNote: 'You cannot apply to the same drive twice.',
  }),
  text: textLayout({
    title: 'Application submitted',
    lines: [
      `Hi ${studentName},`,
      `Your application for ${jobTitle} at ${companyName} was submitted successfully.`,
      [
        `Resume used: ${resumeName || 'Not specified'}`,
        `Applied on: ${formatDate(appliedAt)}`,
        `Current stage: ${currentStage}`,
      ],
      'Track it from the My Applications section. You will be emailed at every stage change.',
    ],
    cta: { label: 'Track my application', url: portalUrl('/app') },
  }),
});

/** Generic stage movement. Feedback is included only when student-visible. */
const stageUpdate = ({
  studentName,
  companyName,
  jobTitle,
  stageName,
  status,
  nextAction,
  feedback,
}) => ({
  subject: `Application Update: ${companyName}`,
  priority: 'NORMAL',
  html: layout({
    title: `Application update — ${escapeHtml(companyName)}`,
    preheader: `Your application moved to ${stageName}`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">The status of your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has changed.</p>
      ${detailTable([
        ['New stage', stageName],
        ['Outcome', status === 'shortlisted' ? 'Shortlisted' : status === 'offered' ? 'Selected' : status === 'rejected' ? 'Not selected' : 'In progress'],
        ['Updated on', formatDate(new Date())],
      ])}
      ${
        nextAction
          ? `<p style="margin:0 0 6px 0;font-weight:600;color:#0f172a;">Next step</p>
             <p style="margin:0 0 16px 0;">${escapeHtml(nextAction)}</p>`
          : ''
      }
      ${
        feedback
          ? `<div style="margin:18px 0;padding:15px;background:#f8fafc;border-left:3px solid #cbd5e1;border-radius:6px;">
               <p style="margin:0 0 6px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#475569;font-weight:700;">Feedback</p>
               <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(feedback)}</p>
             </div>`
          : ''
      }
      ${
        status === 'rejected'
          ? callout('This drive has closed for you. Other drives matching your eligibility are unaffected — keep applying.', 'info')
          : ''
      }
    `,
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
  text: textLayout({
    title: `Application Update: ${companyName}`,
    lines: [
      `Hi ${studentName},`,
      `Your application for ${jobTitle} at ${companyName} has changed.`,
      [
        `New stage: ${stageName}`,
        `Outcome: ${status}`,
        `Updated on: ${formatDate(new Date())}`,
      ],
      nextAction ? `Next step: ${nextAction}` : '',
      feedback ? `Feedback: ${feedback}` : '',
    ],
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
});

const shortlisted = ({ studentName, companyName, jobTitle }) => ({
  subject: `Congratulations! You have been shortlisted for ${companyName}`,
  priority: 'HIGH',
  html: layout({
    title: 'Congratulations — you have been shortlisted',
    preheader: `Shortlisted for ${jobTitle} at ${companyName}`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">Congratulations! You have been <strong>shortlisted</strong> for the following role.</p>
      ${detailTable([
        ['Company', companyName],
        ['Role', jobTitle],
        ['Announced on', formatDate(new Date())],
      ])}
      ${callout('Watch the My Applications section for the next stage. Further rounds are usually scheduled by the placement cell.', 'success')}
    `,
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
  text: textLayout({
    title: 'Congratulations — you have been shortlisted',
    lines: [
      `Hi ${studentName},`,
      `Congratulations! You have been shortlisted for ${jobTitle} at ${companyName}.`,
      'Watch My Applications for the next stage.',
    ],
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
});

/** Student received an offer / was selected. */
const selected = ({ studentName, companyName, jobTitle, joiningDate, nextSteps }) => ({
  subject: `Congratulations! You Have Been Selected for ${companyName}`,
  priority: 'CRITICAL',
  html: layout({
    title: 'Congratulations — you have an offer',
    preheader: `Selected for ${jobTitle} at ${companyName}`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">Congratulations! The placement cell has recorded that you have been <strong>selected</strong> for this role.</p>
      ${detailTable([
        ['Company', companyName],
        ['Role', jobTitle],
        joiningDate ? ['Joining date', formatDate(joiningDate)] : null,
        ['Recorded on', formatDate(new Date())],
      ].filter(Boolean))}
      ${
        nextSteps
          ? `<p style="margin:0 0 6px 0;font-weight:600;color:#0f172a;">Next steps</p>
             <ul style="margin:0 0 16px 0;padding-left:20px;color:#334155;">
               ${nextSteps.map((s) => `<li style="margin-bottom:4px;">${escapeHtml(s)}</li>`).join('')}
             </ul>`
          : ''
      }
      ${callout('Offer documents are not attached to this email. Any official offer letter will be available to you through the authenticated portal only.', 'warn')}
      ${callout('Please continue applying to other drives until the offer is formally accepted and released to you.', 'info')}
    `,
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
  text: textLayout({
    title: 'Congratulations — you have an offer',
    lines: [
      `Hi ${studentName},`,
      `Congratulations! You have been selected for ${jobTitle} at ${companyName}.`,
      joiningDate ? `Joining date: ${formatDate(joiningDate)}` : '',
      nextSteps ? ['Next steps:', ...nextSteps.map((s) => `- ${s}`)] : '',
      'Offer documents are not emailed — download them from the authenticated portal.',
      'Please keep applying until the offer is formally accepted.',
    ],
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
});

module.exports = { applicationSubmitted, stageUpdate, shortlisted, selected };