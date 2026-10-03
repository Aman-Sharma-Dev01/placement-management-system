/**
 * Eligibility + template + token tests.
 *
 * Uses the built-in `node:test` runner, so no test dependency is added.
 * Nothing here touches MongoDB or the network: models are only imported for
 * their path resolution, and eligibility/template/token logic is exercised as
 * pure functions.
 *
 *   node --test tests/
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// --- eligibility (pure function; the model import is only for paths) --------
const { evaluate } = require('../services/eligibilityService');

/** Student factory — overrides win over the defaults. */
const student = (overrides = {}) => ({
  name: 'Test Student',
  email: 'test@example.edu.in',
  branch: 'CSE',
  education: {
    tenth: { percentage: 85 },
    twelfthOrDiploma: 'twelfth',
    twelfth: { percentage: 82 },
    diploma: { percentage: 0 },
    graduation: { cgpa: 8.4, backlogs: { active: 0, history: 0 }, gapYears: 0 },
  },
  ...overrides,
});

/** Drive factory. */
const drive = (eligibility = {}, extra = {}) => ({
  _id: { toString: () => 'drive1' },
  ...extra,
  eligibility: {
    allowedBranches: [],
    minCgpa: 0,
    minTenthPercentage: 0,
    minTwelfthPercentage: 0,
    maxActiveBacklogs: 0,
    maxHistoryBacklogs: 0,
    maxGapYears: 0,
    ...eligibility,
  },
});

test('evaluate: no rules means everyone is eligible', () => {
  const result = evaluate(student(), drive());
  assert.equal(result.eligible, true);
  assert.deepEqual(result.reasons, []);
});

test('evaluate: branch allow-list is enforced', () => {
  assert.equal(evaluate(student(), drive({ allowedBranches: ['CSE'] })).eligible, true);

  const rejected = evaluate(student(), drive({ allowedBranches: ['ECE'] }));
  assert.equal(rejected.eligible, false);
  assert.match(rejected.reasons[0], /Branch/);
});

test('evaluate: minimum CGPA boundary is inclusive', () => {
  assert.equal(evaluate(student(), drive({ minCgpa: 8.4 })).eligible, true);
  assert.equal(evaluate(student(), drive({ minCgpa: 8.5 })).eligible, false);
});

test('evaluate: missing CGPA is a failure, not a pass', () => {
  const noCgpa = student({ education: { ...student().education, graduation: {} } });
  const result = evaluate(noCgpa, drive({ minCgpa: 7 }));
  assert.equal(result.eligible, false);
  assert.match(result.reasons[0], /required/);
});

test('evaluate: 10th and 12th thresholds are checked separately', () => {
  assert.equal(evaluate(student(), drive({ minTenthPercentage: 80 })).eligible, true);
  assert.equal(evaluate(student(), drive({ minTenthPercentage: 90 })).eligible, false);
  assert.equal(evaluate(student(), drive({ minTwelfthPercentage: 80 })).eligible, true);
  assert.equal(evaluate(student(), drive({ minTwelfthPercentage: 90 })).eligible, false);
});

test('evaluate: diploma students are measured on diploma percentage', () => {
  const diploma = student({
    education: {
      ...student().education,
      twelfthOrDiploma: 'diploma',
      diploma: { percentage: 88 },
    },
  });

  assert.equal(evaluate(diploma, drive({ minTwelfthPercentage: 85 })).eligible, true);
  assert.equal(evaluate(diploma, drive({ minTwelfthPercentage: 90 })).eligible, false);
});

test('evaluate: active backlogs above the limit disqualify', () => {
  const backlogged = student({
    education: {
      ...student().education,
      graduation: { cgpa: 8.4, backlogs: { active: 3, history: 0 }, gapYears: 0 },
    },
  });

  assert.equal(evaluate(backlogged, drive({ maxActiveBacklogs: 0 })).eligible, false);
  assert.equal(evaluate(backlogged, drive({ maxActiveBacklogs: 3 })).eligible, true);
});

test('evaluate: gap years above the limit disqualify', () => {
  const gapped = student({
    education: {
      ...student().education,
      graduation: { cgpa: 8.4, backlogs: { active: 0, history: 0 }, gapYears: 2 },
    },
  });

  assert.equal(evaluate(gapped, drive({ maxGapYears: 1 })).eligible, false);
  assert.equal(evaluate(gapped, drive({ maxGapYears: 2 })).eligible, true);
});

test('evaluate: every failed rule is reported, not just the first', () => {
  const poor = student({
    branch: 'MECH',
    education: {
      tenth: { percentage: 60 },
      twelfthOrDiploma: 'twelfth',
      twelfth: { percentage: 55 },
      diploma: { percentage: 0 },
      graduation: { cgpa: 5.1, backlogs: { active: 5, history: 0 }, gapYears: 3 },
    },
  });

  const result = evaluate(
    poor,
    drive({
      allowedBranches: ['CSE'],
      minCgpa: 7,
      minTenthPercentage: 75,
      minTwelfthPercentage: 75,
      maxActiveBacklogs: 1,
      maxGapYears: 1,
    })
  );

  assert.equal(result.eligible, false);
  assert.equal(result.reasons.length, 6);
});

test('evaluate: dangling allowedCategories is ignored (student category removed)', () => {
  // Drives may still carry allowedCategories in the database. It must not
  // influence the outcome, because Student no longer has a category field.
  const result = evaluate(
    student(),
    drive({ allowedCategories: ['General', 'OBC', 'SC', 'ST', 'EWS'] })
  );
  assert.equal(result.eligible, true);
});

test('evaluate: missing student or drive is not eligible', () => {
  assert.equal(evaluate(null, drive()).eligible, false);
  assert.equal(evaluate(student(), null).eligible, false);
});

// --- template registry -----------------------------------------------------
process.env.PORTAL_URL = 'https://portal.test';
process.env.PORTAL_NAME = 'Test Portal';

const { renderTemplate, isSecurityEvent, PRIORITY } = require('../emailTemplates');

const ALL_EVENTS = Object.keys(PRIORITY);

test('templates: every registered event renders subject, html and text', () => {
  for (const event of ALL_EVENTS) {
    const rendered = renderTemplate(event, {
      name: 'Test Student',
      email: 'test@example.edu.in',
      resetUrl: 'https://portal.test/reset-password?token=abc',
      studentName: 'Test Student',
      studentIdentifier: 'SSP-2026-0001',
      coordinatorName: 'Coordinator',
      companyName: 'Acme Corp',
      jobTitle: 'SDE-1',
      positionType: 'Full Time',
      workMode: 'Onsite',
      location: 'Bengaluru',
      ctcLpa: 18,
      deadlineDate: '2026-11-30 18:00',
      changes: [{ label: 'Deadline', before: 'A', after: 'B' }],
      reason: 'Test reason',
      wasCancelled: false,
      hoursLeft: 24,
      stageName: 'Technical Interview',
      status: 'shortlisted',
      stageType: 'technical_interview',
      scheduledAt: '2026-11-20 10:00',
      venueOrLink: 'https://meet.example.com/abc',
      instructions: 'Carry your ID',
      applicantCount: 42,
      pendingVerifications: 7,
      newApplications: 9,
      totalOpenDrives: 5,
      details: [['Key', 'Value']],
      title: 'Test alert',
      headline: 'Test alert',
      recommendation: 'Do the thing',
      joiningDate: '2027-07-01',
      nextSteps: ['Step one'],
      appliedAt: '2026-10-01 09:30',
      resumeName: 'resume.pdf',
      currentStage: 'Applied',
      branch: 'CSE',
      batchYear: 2026,
      isResubmission: false,
      remarks: 'Please correct your CGPA',
      section: 'Education',
      changedAt: new Date('2026-10-01T10:00:00Z'),
    });

    assert.ok(rendered.subject.length > 0, `${event} subject empty`);
    assert.ok(rendered.html.includes('<!DOCTYPE html>'), `${event} html malformed`);
    assert.ok(rendered.text.length > 0, `${event} text empty`);
  }
});

test('templates: unknown event keys throw loudly', () => {
  assert.throws(() => renderTemplate('NOT_A_REAL_EVENT', {}), /Unknown email template/);
});

test('templates: dynamic values are HTML-escaped', () => {
  const rendered = renderTemplate('NEW_JOB_ELIGIBLE', {
    studentName: '<script>alert(1)</script>',
    companyName: 'Acme & Co <b>',
    jobTitle: 'SDE',
  });
  assert.equal(rendered.html.includes('<script>alert(1)</script>'), false);
  assert.ok(rendered.html.includes('&lt;script&gt;'));
});

test('templates: reset link appears in the password reset email', () => {
  const rendered = renderTemplate('PASSWORD_RESET_REQUEST', {
    name: 'Test Student',
    resetUrl: 'https://portal.test/reset-password?token=deadbeef',
    expiresInMinutes: 60,
  });
  assert.ok(rendered.html.includes('token=deadbeef'));
  assert.ok(rendered.text.includes('token=deadbeef'));
  assert.match(rendered.subject, /Password Reset/i);
});

test('templates: portal URL comes from env, not a hardcoded localhost', () => {
  const rendered = renderTemplate('ACCOUNT_WELCOME', { name: 'A', email: 'a@b.c' });
  assert.ok(rendered.html.includes('https://portal.test'));
  assert.equal(rendered.html.includes('localhost:5173'), false);
});

test('templates: confidential feedback is only rendered when provided', () => {
  const withoutFeedback = renderTemplate('APPLICATION_STAGE_UPDATED', {
    studentName: 'A',
    companyName: 'Acme',
    jobTitle: 'SDE',
    stageName: 'GD',
    status: 'rejected',
    feedback: '',
  });
  const withFeedback = renderTemplate('APPLICATION_STAGE_UPDATED', {
    studentName: 'A',
    companyName: 'Acme',
    jobTitle: 'SDE',
    stageName: 'GD',
    status: 'rejected',
    feedback: 'Needs stronger DSA fundamentals',
  });

  assert.equal(withoutFeedback.html.includes('Needs stronger DSA'), false);
  assert.ok(withFeedback.html.includes('Needs stronger DSA'));
});

test('templates: offer email never claims to carry documents', () => {
  const rendered = renderTemplate('APPLICATION_SELECTED', {
    studentName: 'A',
    companyName: 'Acme',
    jobTitle: 'SDE',
  });
  assert.match(rendered.html, /not attached/i);
});

test('templates: HTML inside callout() is tag-balanced', () => {
  // Regression guard: stray closing tags were previously passed into callout(),
  // which emits them verbatim and produces broken markup. A balanced pair like
  // <strong>..</strong> is fine — only unbalanced tags are a problem.
  const fs = require('fs');
  const path = require('path');

  const files = [
    'auth',
    'student',
    'placement',
    'application',
    'interview',
    'admin',
  ].map((dir) => path.join(__dirname, '../emailTemplates', dir, 'index.js'));

  let calloutsChecked = 0;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');

    // Single-quoted callout arguments on one line.
    const args = source.match(/callout\(\s*'([^']*)'\s*(?:,\s*'[a-z]+'\s*)?\)/g) || [];

    for (const arg of args) {
      calloutsChecked += 1;
      const tags = [...arg.matchAll(/<\/?([a-z0-9]+)[^>]*>/gi)].map((m) => ({
        name: m[1].toLowerCase(),
        closing: m[0].startsWith('</'),
      }));

      const open = [];
      for (const tag of tags) {
        if (tag.closing) {
          // Must match the most recent unclosed tag of the same name.
          const last = open.pop();
          assert.equal(
            last,
            tag.name,
            `unbalanced closing </${tag.name}> in ${file}: ${arg}`
          );
        } else if (!['br', 'img', 'hr'].includes(tag.name)) {
          open.push(tag.name);
        }
      }
      assert.deepEqual(open, [], `unclosed tags in ${file}: ${arg}`);
    }
  }

  assert.ok(calloutsChecked >= 10, `expected to inspect several callouts, saw ${calloutsChecked}`);
});

test('security: password events are never suppressible by preferences', () => {
  assert.equal(isSecurityEvent('PASSWORD_RESET_REQUEST'), true);
  assert.equal(isSecurityEvent('PASSWORD_CHANGED'), true);
  assert.equal(isSecurityEvent('NEW_JOB_ELIGIBLE'), false);
});

test('security: reset/change emails are the highest priority', () => {
  assert.equal(PRIORITY.PASSWORD_RESET_REQUEST, 'CRITICAL');
  assert.equal(PRIORITY.PASSWORD_CHANGED, 'CRITICAL');
  assert.equal(PRIORITY.APPLICATION_SELECTED, 'CRITICAL');
});

// --- password reset token hashing ------------------------------------------
const { sha256 } = require('../services/passwordResetService');

test('reset token: hashing is deterministic and irreversible in practice', () => {
  const raw = crypto.randomBytes(32).toString('hex');
  assert.equal(raw.length, 64);
  assert.equal(sha256(raw), sha256(raw));
  assert.notEqual(sha256(raw), raw);
  assert.notEqual(sha256(raw), sha256(`${raw}x`));
});

test('reset token: two issued tokens never collide', () => {
  const hashes = new Set(
    Array.from({ length: 500 }, () => sha256(crypto.randomBytes(32).toString('hex')))
  );
  assert.equal(hashes.size, 500);
});
