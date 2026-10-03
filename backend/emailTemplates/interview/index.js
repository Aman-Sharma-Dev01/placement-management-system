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

const STAGE_LABEL = {
  online_test: 'Online Test',
  resume_shortlist: 'Resume Shortlisting',
  group_discussion: 'Group Discussion',
  technical_interview: 'Technical Interview',
  hr_interview: 'HR Interview',
  pre_placement_talk: 'Pre-Placement Talk',
};

const stageLabel = (stage) => STAGE_LABEL[stage] || stage || 'Next round';

/**
 * A hiring round was scheduled. `previous` is supplied for reschedules so the
 * student can see what changed.
 */
const scheduled = ({
  studentName,
  companyName,
  jobTitle,
  stageType,
  stageName,
  scheduledAt,
  venueOrLink,
  instructions,
  previous,
}) => {
  const isReschedule = Boolean(previous && previous.scheduledAt);

  return {
    subject: `${isReschedule ? 'Rescheduled' : 'Scheduled'}: ${stageLabel(stageType)} — ${companyName}`,
    priority: isReschedule ? 'HIGH' : 'NORMAL',
    html: layout({
      title: `${isReschedule ? 'Your round has been rescheduled' : `${stageLabel(stageType)} scheduled`}`,
      preheader: `${companyName} — ${stageLabel(stageType)}`,
      bodyHtml: `
        ${greeting(studentName)}
        <p style="margin:0 0 14px 0;">${
          isReschedule
            ? `The <strong>${escapeHtml(stageLabel(stageType))}</strong> for ${escapeHtml(companyName)} has been rescheduled. Please note the new schedule.`
            : `Your <strong>${escapeHtml(stageLabel(stageType))}</strong> for ${escapeHtml(companyName)} has been scheduled.`
        }</p>
        ${
          isReschedule
            ? `<div style="margin:0 0 18px 0;padding:14px 16px;background:#f8fafc;border-radius:8px;">
                 <p style="margin:0 0 10px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;font-weight:700;">Change</p>
                 <p style="margin:0;font-size:13px;line-height:1.7;color:#475569;">
                   <span style="text-decoration:line-through;">${escapeHtml(formatDate(previous.scheduledAt))}</span>
                   &nbsp;&rarr;&nbsp;
                   <strong style="color:#0f172a;">${escapeHtml(formatDate(scheduledAt))}</strong>
                   ${previous.venueOrLink && previous.venueOrLink !== venueOrLink ? `<br><span style="text-decoration:line-through;">${escapeHtml(previous.venueOrLink)}</span> &rarr; <strong>${escapeHtml(venueOrLink)}</strong>` : ''}
                 </p>
               </div>`
            : ''
        }
        ${detailTable([
          ['Company', companyName],
          ['Role', jobTitle],
          ['Round', stageName || stageLabel(stageType)],
          [isReschedule ? 'New schedule' : 'Scheduled for', scheduledAt ? formatDate(scheduledAt) : 'To be announced'],
          ['Venue / link', venueOrLink],
        ])}
        ${
          instructions
            ? `<p style="margin:0 0 8px 0;font-weight:600;color:#0f172a;">Instructions</p>
               <p style="margin:0 0 16px 0;">${escapeHtml(instructions)}</p>`
            : ''
        }
        ${callout(
          venueOrLink && /^https?:\/\//i.test(venueOrLink)
            ? 'Use the link above to join. If it does not work, contact the placement cell immediately — do not miss the round.'
            : 'Reach the venue 15 minutes early and carry a printed copy of your resume and a valid college ID.',
          'warn'
        )}
      `,
      cta: { label: 'View my applications', url: portalUrl('/app') },
    }),
    text: textLayout({
      title: isReschedule ? 'Round rescheduled' : `${stageLabel(stageType)} scheduled`,
      lines: [
        `Hi ${studentName},`,
        isReschedule
          ? `Your ${stageLabel(stageType)} for ${companyName} was rescheduled.`
          : `Your ${stageLabel(stageType)} for ${companyName} has been scheduled.`,
        [
          `Role: ${jobTitle}`,
          `Scheduled for: ${scheduledAt ? formatDate(scheduledAt) : 'To be announced'}`,
          `Venue / link: ${venueOrLink || 'To be announced'}`,
        ],
        isReschedule ? `Previously: ${formatDate(previous.scheduledAt)}` : '',
        instructions ? `Instructions: ${instructions}` : '',
      ],
      cta: { label: 'View my applications', url: portalUrl('/app') },
    }),
  };
};

/** Reminder for an upcoming round — never sent for cancelled/rejected/withdrawn. */
const reminder = ({ studentName, companyName, jobTitle, stageType, scheduledAt, venueOrLink }) => ({
  subject: `Reminder: ${stageLabel(stageType)} tomorrow — ${companyName}`,
  priority: 'NORMAL',
  html: layout({
    title: 'Round reminder',
    preheader: `${stageLabel(stageType)} for ${companyName} is coming up.`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">This is a reminder that your <strong>${escapeHtml(stageLabel(stageType))}</strong> for ${escapeHtml(companyName)} is coming up.</p>
      ${detailTable([
        ['Company', companyName],
        ['Role', jobTitle],
        ['Scheduled for', scheduledAt ? formatDate(scheduledAt) : 'To be announced'],
        ['Venue / link', venueOrLink],
      ])}
      ${callout('Missing a round usually ends your candidacy for that drive. Contact the placement cell immediately if you have a genuine conflict.', 'warn')}
    `,
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
  text: textLayout({
    title: 'Round reminder',
    lines: [
      `Hi ${studentName},`,
      `Reminder: your ${stageLabel(stageType)} for ${companyName} is coming up.`,
      `Scheduled for: ${scheduledAt ? formatDate(scheduledAt) : 'To be announced'}`,
      `Venue / link: ${venueOrLink || 'To be announced'}`,
      'Contact the placement cell immediately if you have a genuine conflict.',
    ],
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
});

/** Round cancelled. */
const cancelled = ({
  studentName,
  companyName,
  jobTitle,
  stageType,
  previousScheduledAt,
  reason,
  hiringStopped,
}) => ({
  subject: `Cancelled: ${stageLabel(stageType)} — ${companyName}`,
  priority: 'HIGH',
  html: layout({
    title: 'Round cancelled',
    preheader: `Your ${stageLabel(stageType)} at ${companyName} has been cancelled.`,
    bodyHtml: `
      ${greeting(studentName)}
      <p style="margin:0 0 14px 0;">Your <strong>${escapeHtml(stageLabel(stageType))}</strong> for ${escapeHtml(companyName)} has been cancelled.</p>
      ${detailTable([
        ['Company', companyName],
        ['Role', jobTitle],
        previousScheduledAt ? ['Previously scheduled', formatDate(previousScheduledAt)] : null,
      ].filter(Boolean))}
      ${reason ? `<p style="margin:0 0 16px 0;">${escapeHtml(reason)}</p>` : ''}
      ${callout(
        hiringStopped
          ? 'Hiring for this drive has stopped. Your application record stays in the portal and other drives are unaffected.'
          : 'Do not travel to the venue. The placement cell will notify you of a revised schedule if the round is rescheduled.',
        hiringStopped ? 'info' : 'warn'
      )}
    `,
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
  text: textLayout({
    title: 'Round cancelled',
    lines: [
      `Hi ${studentName},`,
      `Your ${stageLabel(stageType)} for ${companyName} has been cancelled.`,
      previousScheduledAt ? `Previously scheduled: ${formatDate(previousScheduledAt)}` : '',
      reason ? `Reason: ${reason}` : '',
      hiringStopped
        ? 'Hiring for this drive has stopped. Other drives are unaffected.'
        : 'Do not travel to the venue. You will be notified if it is rescheduled.',
    ],
    cta: { label: 'View my applications', url: portalUrl('/app') },
  }),
});

module.exports = { scheduled, reminder, cancelled };