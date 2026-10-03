const {
  layout,
  textLayout,
  detailTable,
  callout,
  greeting,
  escapeHtml,
  portalUrl,
  formatDate,
  displayValue,
  changeParts,
  describeChange,
} = require('../layout');

const money = (lpa) => (lpa ? `${escapeHtml(lpa)} LPA` : '');

/** Student is eligible for a newly published drive. */
const newJob = ({
  studentName,
  companyName,
  jobTitle,
  positionType,
  workMode,
  location,
  ctcLpa,
  stipendMonthly,
  deadlineDate,
  eligibilitySummary = [],
  driveUrl,
}) => ({
  subject: `New Placement Opportunity: ${companyName}`,
  priority: 'HIGH',
  html: layout({
    title: `New opportunity at ${escapeHtml(companyName)}`,
    preheader: `${jobTitle} — ${positionType}`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">You are eligible for a new placement drive. Applications are open.</p>
      ${detailTable([
        ['Company', companyName],
        ['Role', jobTitle],
        ['Employment type', positionType],
        ['Work mode', workMode],
        ['Location', location],
        positionType === 'Full Time' ? ['CTC', money(ctcLpa)] : ['Monthly stipend', stipendMonthly ? `₹${escapeHtml(stipendMonthly)}` : ''],
        ['Apply by', deadlineDate ? formatDate(deadlineDate) : 'As soon as possible'],
      ])}
      ${
        eligibilitySummary.length
          ? `<p style="margin:0 0 8px 0;font-weight:600;color:#0f172a;">You meet these requirements</p>
             <ul style="margin:0 0 16px 0;padding-left:20px;color:#334155;">
               ${eligibilitySummary.map((item) => `<li style="margin-bottom:4px;">${escapeHtml(item)}</li>`).join('')}
             </ul>`
          : ''
      }
      ${callout('Apply before the deadline — this drive will not accept applications after it closes.', 'warn')}
    `,
    cta: { label: 'View & Apply', url: driveUrl || portalUrl('/app') },
    footerNote: 'You received this because your profile matches this drive\'s eligibility criteria.',
  }),
  text: textLayout({
    title: `New Placement Opportunity: ${companyName}`,
    lines: [
      `Hi ${studentName},`,
      'You are eligible for a new placement drive. Applications are open.',
      [
        `Company: ${companyName}`,
        `Role: ${jobTitle}`,
        `Employment type: ${positionType}`,
        `Work mode: ${workMode}`,
        `Location: ${location || 'As advertised'}`,
        positionType === 'Full Time' ? `CTC: ${ctcLpa} LPA` : stipendMonthly ? `Monthly stipend: ₹${stipendMonthly}` : '',
        `Apply by: ${deadlineDate ? formatDate(deadlineDate) : 'ASAP'}`,
      ].filter(Boolean),
      eligibilitySummary.length ? ['You meet these requirements:', ...eligibilitySummary.map((i) => `- ${i}`)] : '',
      'Apply before the deadline — applications close after that.',
    ],
    cta: { label: 'View & Apply', url: driveUrl || portalUrl('/app') },
  }),
});

/** Drive changed in a way that affects applicants. */
const driveUpdated = ({ studentName, companyName, jobTitle, changes = [], driveUrl }) => ({
  subject: `Placement Drive Updated: ${companyName}`,
  priority: changes.some((c) => /deadline|ctc|clos/i.test(c.label)) ? 'HIGH' : 'NORMAL',
  html: layout({
    title: `${escapeHtml(companyName)} drive updated`,
    preheader: `${jobTitle} — details have changed`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">Details for the ${escapeHtml(jobTitle)} drive at ${escapeHtml(companyName)} have changed:</p>
      ${detailTable(changes.map((c) => {
        const parts = changeParts(c);
        return parts ? [escapeHtml(parts.label), escapeHtml(parts.value)] : null;
      }).filter(Boolean))}
      ${callout('Please review the updated details before proceeding with your application.', 'info')}
    `,
    cta: { label: 'View updated drive', url: driveUrl || portalUrl('/app') },
  }),
  text: textLayout({
    title: `Placement Drive Updated: ${companyName}`,
    lines: [
      `Hi ${studentName},`,
      `Details for the ${jobTitle} drive at ${companyName} have changed:`,
      changes.map((c) => `- ${describeChange(c)}`),
      'Please review the updated details.',
    ],
    cta: { label: 'View updated drive', url: driveUrl || portalUrl('/app') },
  }),
});

/** Drive closed or was withdrawn after students applied. */
const driveClosed = ({ studentName, companyName, jobTitle, reason, wasCancelled = true }) => ({
  subject: wasCancelled
    ? `Placement Drive Cancelled: ${companyName}`
    : `Placement Drive Closed: ${companyName}`,
  priority: 'HIGH',
  html: layout({
    title: wasCancelled
      ? `${escapeHtml(companyName)} drive cancelled`
      : `${escapeHtml(companyName)} drive closed`,
    preheader: `Applications for ${jobTitle} are no longer being accepted`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">${
        wasCancelled
          ? 'The placement cell has withdrawn this drive. Applications are no longer being accepted.'
          : 'Applications for this drive have now closed.'
      }</p>
      ${detailTable([
        ['Company', companyName],
        ['Role', jobTitle],
        ['Status', wasCancelled ? 'Cancelled' : 'Closed'],
      ])}
      ${
        reason
          ? `<div style="margin:18px 0;padding:15px;background:#fef2f2;border-left:3px solid #fecaca;border-radius:6px;">
               <p style="margin:0 0 6px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#991b1b;font-weight:700;">Notice</p>
               <p style="margin:0;font-size:14px;line-height:1.6;color:#7f1d1d;">${escapeHtml(reason)}</p>
             </div>`
          : ''
      }
      <p style="margin:0 0 6px 0;font-weight:600;color:#0f172a;">What to do next</p>
      <ul style="margin:0;padding-left:20px;color:#334155;">
        <li style="margin-bottom:6px;">Your existing application record stays in the portal — no action needed to withdraw it.</li>
        <li>Watch the Job Profiles section for other drives matching your eligibility.</li>
      </ul>
    `,
    cta: { label: 'Browse other opportunities', url: portalUrl('/app') },
    footerNote: 'No further action is required on your part.',
  }),
  text: textLayout({
    title: wasCancelled ? `Placement Drive Cancelled: ${companyName}` : `Placement Drive Closed: ${companyName}`,
    lines: [
      `Hi ${studentName},`,
      wasCancelled
        ? `The ${jobTitle} drive at ${companyName} has been cancelled. Applications are no longer accepted.`
        : `Applications for the ${jobTitle} drive at ${companyName} have closed.`,
      reason ? `Notice: ${reason}` : '',
      'Your application record remains in the portal. Watch the Job Profiles section for other drives.',
    ],
    cta: { label: 'Browse other opportunities', url: portalUrl('/app') },
  }),
});

/** Deadline reminder — only for eligible students who have NOT applied. */
const deadlineReminder = ({ studentName, companyName, jobTitle, deadlineDate, hoursLeft, driveUrl }) => ({
  subject: `Closing soon: ${companyName} — ${hoursLeft}h left to apply`,
  priority: 'NORMAL',
  html: layout({
    title: `Applications close in ${escapeHtml(hoursLeft)} hours`,
    preheader: `${jobTitle} at ${companyName} closes soon.`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">You are eligible for this drive and have not applied yet. Applications close in about <strong>${escapeHtml(hoursLeft)} hours</strong>.</p>
      ${detailTable([
        ['Company', companyName],
        ['Role', jobTitle],
        ['Deadline', deadlineDate ? formatDate(deadlineDate) : 'Soon'],
      ])}
      ${callout('This is the last reminder for this drive. After the deadline no applications will be accepted.', 'warn')}
    `,
    cta: { label: 'Apply now', url: driveUrl || portalUrl('/app') },
  }),
  text: textLayout({
    title: `Applications close in ${hoursLeft} hours`,
    lines: [
      `Hi ${studentName},`,
      `You are eligible for the ${jobTitle} drive at ${companyName} and have not applied yet.`,
      `Applications close in about ${hoursLeft} hours.`,
      'This is the last reminder for this drive.',
    ],
    cta: { label: 'Apply now', url: driveUrl || portalUrl('/app') },
  }),
});

module.exports = { newJob, driveUpdated, driveClosed, deadlineReminder };