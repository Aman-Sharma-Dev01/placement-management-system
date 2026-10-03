/**
 * Centralised email layout. Every template renders through here so branding,
 * CTA styling and the footer stay consistent.
 *
 * All dynamic values MUST pass through `escapeHtml` before interpolation.
 */

const PORTAL_NAME = () => process.env.PORTAL_NAME || 'Superset Placement Portal';
// Must match the Vite dev server port (see frontend/vite.config.ts).
const PORTAL_URL = () => (process.env.PORTAL_URL || 'http://localhost:3000').replace(/\/+$/, '');
const SUPPORT_EMAIL = () => process.env.SUPPORT_EMAIL || 'placement.cell@university.edu.in';
const UNIVERSITY_NAME = () => process.env.UNIVERSITY_NAME || 'University Placement Cell';

const escapeHtml = (value) => {
  if (value === null || typeof value === 'undefined') return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Strips characters that would break a mailto: or plain-text line.
const escapeText = (value) => {
  if (value === null || typeof value === 'undefined') return '';
  return String(value).replace(/\r?\n/g, ' ').trim();
};

const portalUrl = (path = '') => `${PORTAL_URL()}${path ? (path.startsWith('/') ? path : `/${path}`) : ''}`;

const priorityBadge = (priority) => {
  const map = {
    CRITICAL: { bg: '#fee2e2', fg: '#991b1b', label: 'Action required' },
    HIGH: { bg: '#ffedd5', fg: '#9a3412', label: 'Important' },
    NORMAL: { bg: '#d1fae5', fg: '#065f46', label: 'Update' },
    LOW: { bg: '#f1f5f9', fg: '#334155', label: 'For your info' },
  };
  const badge = map[priority] || map.NORMAL;
  return `<span style="display:inline-block;background:${badge.bg};color:${badge.fg};font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:4px 10px;border-radius:9999px;">${badge.label}</span>`;
};

const layout = ({
  title,
  preheader = '',
  bodyHtml,
  cta,
  footerNote = '',
}) => {
  const portalName = escapeHtml(PORTAL_NAME());
  const university = escapeHtml(UNIVERSITY_NAME());
  const support = escapeHtml(SUPPORT_EMAIL());

  const button = cta && cta.url && cta.label
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr><td style="border-radius:10px;background:#059669;">
          <a href="${escapeHtml(cta.url)}" target="_blank" rel="noopener"
             style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
            ${escapeHtml(cta.label)}
          </a>
        </td></tr></table>`
    : '';

  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
${preheaderBlock}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:28px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,.08);">

      <tr><td style="background:#059669;padding:22px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:17px;font-weight:700;color:#ffffff;letter-spacing:-.01em;">${portalName}</td>
          <td align="right" style="font-size:12px;color:#d1fae5;">${university}</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:32px 28px 8px 28px;">
        <h1 style="margin:0 0 16px 0;font-size:21px;line-height:1.3;font-weight:700;color:#0f172a;">${escapeHtml(title)}</h1>
      </td></tr>

      <tr><td style="padding:0 28px 28px 28px;font-size:15px;line-height:1.65;color:#334155;">
        ${bodyHtml}
      </td></tr>

      <tr><td style="padding:0 28px 28px 28px;" align="center">
        ${button}
      </td></tr>

      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 28px;">
        <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;">
          Sent by ${portalName} on behalf of ${university}.
        </p>
        ${footerNote ? `<p style="margin:0 0 6px 0;font-size:12px;color:#64748b;">${footerNote}</p>` : ''}
        <p style="margin:0;font-size:12px;color:#64748b;">
          Need help? Contact <a href="mailto:${support}" style="color:#059669;text-decoration:none;">${support}</a>
        </p>
        <p style="margin:10px 0 0 0;font-size:11px;color:#94a3b8;">
          You are receiving this because you have an active account on ${portalName}.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
};

/** Plain-text counterpart for clients that do not render HTML. */
const textLayout = ({ title, lines = [], cta, footerNote = '' }) => {
  const parts = [title, ''];
  lines.filter(Boolean).forEach((line) => {
    if (Array.isArray(line)) {
      parts.push(...line.map((item) => `  - ${item}`));
    } else {
      parts.push(line);
    }
  });
  if (cta && cta.url && cta.label) {
    parts.push('', `${cta.label}: ${cta.url}`);
  }
  parts.push('', `${PORTAL_NAME()} — ${UNIVERSITY_NAME()}`);
  if (footerNote) parts.push(footerNote);
  parts.push(`Support: ${SUPPORT_EMAIL()}`);
  return parts.join('\n');
};

/** Key/value detail grid used by most templates. */
const detailTable = (rows) => {
  const valid = rows.filter(([, value]) => value !== null && typeof value !== 'undefined' && value !== '');
  if (!valid.length) return '';

  const cells = valid
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:9px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#64748b;width:42%;white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:9px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:500;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0;">${cells}</table>`;
};

const callout = (text, tone = 'info') => {
  const tones = {
    info: { bg: '#eff6ff', border: '#bfdbfe', fg: '#1e40af' },
    warn: { bg: '#fffbeb', border: '#fde68a', fg: '#92400e' },
    danger: { bg: '#fef2f2', border: '#fecaca', fg: '#991b1b' },
    success: { bg: '#ecfdf5', border: '#a7f3d0', fg: '#065f46' },
  };
  const t = tones[tone] || tones.info;
  return `<div style="margin:18px 0;padding:13px 15px;background:${t.bg};border-left:3px solid ${t.border};border-radius:6px;font-size:14px;line-height:1.6;color:${t.fg};">${text}</div>`;
};

/**
 * Human-friendly date for a stored string, ISO string, or Date.
 * Returns plain text — `detailTable` escapes it for HTML, and the text layout
 * needs the unescaped value.
 */
const formatDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const greeting = (name) => {
  const safe = escapeHtml(name || 'there');
  return `<p style="margin:0 0 14px 0;">Hi ${safe},</p>`;
};

/** Renders a possibly-empty scalar the way a reader expects to see it. */
const displayValue = (value) => {
  if (value === undefined || value === null || value === '') return '(not set)';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '(not set)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

/**
 * Drive updates arrive as `{ label, before, after }` from the controller, but
 * `{ label, value }` is the shape used by single-value events. Normalise both
 * into one readable `before -> after` / `label: value` string so callers, the
 * notification body and the idempotency key all describe the same change.
 */
const changeParts = (change) => {
  if (!change || !change.label) return null;
  const hasBeforeAfter = 'before' in change || 'after' in change;
  if (!hasBeforeAfter) {
    return { label: String(change.label), value: displayValue(change.value) };
  }
  const before = displayValue(change.before);
  const after = displayValue(change.after);
  const value = before === after ? after : `${before} -> ${after}`;
  return { label: String(change.label), value };
};

const describeChange = (change) => {
  const parts = changeParts(change);
  return parts ? `${parts.label}: ${parts.value}` : '';
};

module.exports = {
  escapeHtml,
  escapeText,
  layout,
  textLayout,
  detailTable,
  callout,
  greeting,
  priorityBadge,
  portalUrl,
  formatDate,
  displayValue,
  changeParts,
  describeChange,
  PORTAL_NAME,
  PORTAL_URL,
  SUPPORT_EMAIL,
  UNIVERSITY_NAME,
};