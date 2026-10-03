const { layout, textLayout, callout, detailTable, escapeHtml } = require('../layout');

/**
 * System / admin-only alerts. Reserved for genuine infrastructure problems —
 * never for ordinary placement workflow, which stays with the placement cell
 * and coordinators.
 */
const systemAlert = ({ title, headline, details = [], recommendation, eventKey }) => ({
  subject: `[System] ${title}`,
  priority: 'CRITICAL',
  html: layout({
    title: headline || title,
    preheader: title,
    bodyHtml: `
      ${callout('This is an automated infrastructure alert. No action on placement data is required unless stated below.', 'danger')}
      ${detailTable(details)}
      ${
        recommendation
          ? `<p style="margin:0 0 8px 0;font-weight:600;color:#0f172a;">Recommended action</p>
             <p style="margin:0;">${escapeHtml(recommendation)}</p>`
          : ''
      }
      ${eventKey ? `<p style="margin:18px 0 0 0;font-size:11px;color:#94a3b8;">Alert reference: ${escapeHtml(eventKey)}</p>` : ''}
    `,
    cta: null,
    footerNote: 'Alerted to super administrators for infrastructure monitoring.',
  }),
  text: textLayout({
    title: headline || title,
    lines: [
      'Automated infrastructure alert.',
      details.map(([label, value]) => `${label}: ${value}`),
      recommendation ? `Recommended action: ${recommendation}` : '',
      eventKey ? `Alert reference: ${eventKey}` : '',
    ],
  }),
});

/** Coordinator / cell operational digest — actionable items only. */
const operationalDigest = ({ recipientName, items = [] }) => ({
  subject: `Pending actions: ${items.length} item${items.length === 1 ? '' : 's'} need your attention`,
  priority: 'NORMAL',
  html: layout({
    title: 'Items waiting on you',
    preheader: `${items.length} actionable item(s) in the placement portal`,
    bodyHtml: `
      <p style="margin:0 0 14px 0;">Hello ${escapeHtml(recipientName || 'there')},</p>
      <p style="margin:0 0 16px 0;">${
        items.length
          ? 'The following need your attention:'
          : 'Nothing is waiting on you right now.'
      }</p>
      ${
        items.length
          ? `<ul style="margin:0 0 16px 0;padding-left:20px;color:#334155;">
               ${items.map((item) => `<li style="margin-bottom:8px;">${escapeHtml(item)}</li>`).join('')}
             </ul>`
          : ''
      }
      ${callout('This digest only lists actionable items. Routine activity is available in the portal and does not generate email.', 'info')}
    `,
    cta: items.length ? { label: 'Open the portal', url: require('../layout').portalUrl('/app') } : null,
  }),
  text: textLayout({
    title: 'Items waiting on you',
    lines: [
      `Hello ${recipientName || 'there'},`,
      items.length ? 'The following need your attention:' : 'Nothing is waiting on you right now.',
      items,
    ],
    cta: items.length ? { label: 'Open the portal', url: require('../layout').portalUrl('/app') } : null,
  }),
});

module.exports = { systemAlert, operationalDigest };