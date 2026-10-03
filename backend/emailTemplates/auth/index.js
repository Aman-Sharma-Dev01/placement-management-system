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

/** Sent once, immediately after an account is created. */
const welcome = ({ name, email }) => ({
  subject: `Welcome to ${require('../layout').PORTAL_NAME()}`,
  priority: 'HIGH',
  html: layout({
    title: 'Welcome aboard!',
    preheader: 'Your account is ready. Complete your profile to apply for placements.',
    bodyHtml: `
      ${greeting(name)}
      <p style="margin:0 0 14px 0;">Your account on the placement portal has been created successfully.</p>
      ${detailTable([
        ['Name', name],
        ['Email', email],
        ['Registered on', formatDate(new Date())],
      ])}
      <p style="margin:0 0 10px 0;font-weight:600;color:#0f172a;">What to do next</p>
      <ol style="margin:0 0 16px 0;padding-left:20px;color:#334155;">
        <li style="margin-bottom:6px;">Sign in to the portal.</li>
        <li style="margin-bottom:6px;">Complete your profile — education, skills, projects and resumes.</li>
        <li style="margin-bottom:6px;">Submit it for verification by the placement coordinator.</li>
        <li>Once verified, you can apply to every drive you are eligible for.</li>
      </ol>
      ${callout('Your account is active, but you will not be able to apply to drives until your profile is verified by the placement coordinator.', 'info')}
      ${callout('<strong>Security note:</strong> we will never ask you for your password over email. If you receive anything claiming otherwise, ignore it and contact the placement cell.', 'warn')}
    `,
    cta: { label: 'Complete your profile', url: portalUrl('/app') },
    footerNote: 'Keep this email for your records.',
  }),
  text: textLayout({
    title: 'Welcome aboard!',
    lines: [
      `Hi ${name},`,
      'Your account on the placement portal has been created successfully.',
      [`Name: ${name}`, `Email: ${email}`, `Registered on: ${formatDate(new Date())}`],
      'What to do next:',
      ['1. Sign in to the portal.', '2. Complete your profile.', '3. Submit it for verification.', '4. Apply once verified.'],
      'Security note: we never ask for your password over email.',
    ],
    cta: { label: 'Complete your profile', url: portalUrl('/app') },
  }),
});

/**
 * Password reset request. Carries a one-time link — never the password.
 * Always sent, regardless of the user's email preferences.
 */
const passwordReset = ({ name, resetUrl, expiresInMinutes }) => {
  const minutes = expiresInMinutes || 60;
  return {
    subject: 'Password Reset Request',
    priority: 'CRITICAL',
    html: layout({
      title: 'Password Reset Request',
      preheader: 'A password reset link was requested for your account.',
      bodyHtml: `
        ${greeting(name)}
        <p style="margin:0 0 14px 0;">We received a request to reset the password for your account.</p>
        <p style="margin:0 0 6px 0;">Use the secure link below to choose a new password. It can be used <strong>once</strong> and expires in <strong>${escapeHtml(minutes)} minutes</strong>.</p>
        ${callout('If you did not request this, you can safely ignore this email. Your password will not change until the link above is used.', 'warn')}
        ${callout('<strong>Security reminder:</strong> the placement cell will never ask for your existing password, OTP, or bank details by email. Never forward this link — it grants full access to your account.', 'danger')}
      `,
      cta: { label: 'Reset your password', url: resetUrl },
      footerNote: `This link expires ${minutes} minutes after it was generated.`,
    }),
    text: textLayout({
      title: 'Password Reset Request',
      lines: [
        `Hi ${name},`,
        'We received a request to reset your account password.',
        `The link below can be used once and expires in ${minutes} minutes.`,
        'If you did not request this, ignore this email — your password will not change.',
        'Security reminder: the placement cell never asks for your password by email.',
      ],
      cta: { label: 'Reset your password', url: resetUrl },
    }),
  };
};

/** Sent after a password is actually changed. Always sent. */
const passwordChanged = ({ name, changedAt }) => ({
  subject: 'Your password has been reset successfully',
  priority: 'CRITICAL',
  html: layout({
    title: 'Your password has been reset',
    preheader: 'Your password was changed successfully.',
    bodyHtml: `
      ${greeting(name)}
      <p style="margin:0 0 14px 0;">Your account password was changed successfully.</p>
      ${detailTable([['Changed on', formatDate(changedAt || new Date())]])}
      ${callout('<strong>Was this you?</strong> If you did not change your password, reset it immediately and contact the placement cell — someone may have access to your account.', 'danger')}
      <p style="margin:0;">For security, any other active sessions should be signed out again.</p>
    `,
    cta: { label: 'Sign in to the portal', url: portalUrl('/login') },
  }),
  text: textLayout({
    title: 'Your password has been reset',
    lines: [
      `Hi ${name},`,
      'Your account password was changed successfully.',
      `Changed on: ${formatDate(changedAt || new Date())}`,
      'If this was not you, reset your password immediately and contact the placement cell.',
    ],
    cta: { label: 'Sign in to the portal', url: portalUrl('/login') },
  }),
});

module.exports = { welcome, passwordReset, passwordChanged };