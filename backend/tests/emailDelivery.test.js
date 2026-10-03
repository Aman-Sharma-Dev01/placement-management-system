/**
 * Email delivery behaviour with a mocked SMTP transport.
 *
 * Verifies the guarantees that matter most and are easy to regress:
 *  - a dead relay never throws at the caller
 *  - transient failures retry, permanent ones do not
 *  - a business action still succeeds when SMTP is down
 *  - missing SMTP config degrades to SKIPPED, not crash
 *
 * No real network and no real MongoDB: models are replaced with in-memory
 * stubs before the services load.
 *
 *   node --test tests/
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// Delivery tuning must be in place BEFORE the services load: emailService
// reads these once at module scope.
process.env.EMAIL_RETRY_DELAYS_MS = '0,0';
process.env.EMAIL_MAX_ATTEMPTS = '3';
process.env.EMAIL_FAILURE_ALERT_THRESHOLD = '1000';

// --- in-memory mongoose stub ----------------------------------------------
const logs = [];
const notifications = [];

const stubModel = (name, extra = {}) => {
  const doc = (data) => ({ ...data, save: async () => data, toObject: () => ({ ...data }) });

  const model = {
    modelName: name,
    // Notification
    create: async (data) => {
      const record = doc(data);
      notifications.push(record);
      return record;
    },
    updateOne: async () => ({ acknowledged: true, modifiedCount: 1 }),
    findOneAndUpdate: async () => null,
    // EmailLog
    createIndexes: async () => {},
    // User
    findById: async () => null,
    find: async () => [],
    __logs: logs,
    ...extra,
  };

  const calls = [];
  model.__calls = calls;
  return model;
};

let idCounter = 0;
const nextId = () => {
  idCounter += 1;
  return `stub-id-${idCounter}`;
};

const emailLogStub = stubModel('EmailLog', {
  create: async (data) => {
    const record = { _id: nextId(), ...data, save: async () => record };
    logs.push(record);
    return record;
  },
  // Must actually mutate, otherwise status transitions are invisible to tests.
  updateOne: async (filter, update) => {
    const record = logs.find((item) => String(item._id) === String(filter._id));
    if (record) {
      Object.assign(record, update.$set || {});
      if (update.$inc) {
        Object.keys(update.$inc).forEach((key) => {
          record[key] = (record[key] || 0) + update.$inc[key];
        });
      }
    }
    return { acknowledged: true, modifiedCount: record ? 1 : 0 };
  },
});

const notificationStub = stubModel('Notification', {
  create: async (data) => {
    // Emulate the unique sparse eventKey index.
    if (data.eventKey && notifications.some((n) => n.eventKey === data.eventKey)) {
      const error = new Error('E11000 duplicate key error');
      error.code = 11000;
      throw error;
    }
    const record = { _id: nextId(), ...data, save: async () => record, toObject: () => ({ ...data }) };
    notifications.push(record);
    return record;
  },
  updateOne: async (filter, update) => {
    const record = notifications.find((item) => String(item._id) === String(filter._id));
    if (record) Object.assign(record, update.$set || {});
    return { acknowledged: true, modifiedCount: record ? 1 : 0 };
  },
});

// Mongoose queries are chainable (`.find().select()`), so the stub returns an
// object whose `.select()` resolves — mirroring what the services rely on.
const userStub = {
  modelName: 'User',
  findById: async () => null,
  find: async () => [],
};

/** Overridable User lookups used by the preference tests. */
let userByIdResult = null;
let userFindResult = [];

userStub.findById = () => ({
  select: async () => userByIdResult,
});
userStub.find = () => ({
  select: async () => userFindResult,
});

const Module = require('node:module');
const originalLoad = Module._load;

let sentMails = [];
let sendMailBehaviour = async () => ({ messageId: 'mock-1' });

const MODEL_STUBS = {
  EmailLog: emailLogStub,
  Notification: notificationStub,
  User: userStub,
  Student: stubModel('Student'),
  Application: stubModel('Application'),
  PlacementDrive: stubModel('PlacementDrive'),
  PasswordResetToken: stubModel('PasswordResetToken'),
};

// Mocked transport. `sendMailBehaviour` is swapped per test.
const mailerStub = {
  isConfigured: () => true,
  fromAddress: () => ({ name: 'Test', address: 'noreply@test.local' }),
  verifyConnection: async () => ({ ok: true, configured: true, error: '' }),
  getTransporter: () => ({
    sendMail: async (mail) => {
      sentMails.push(mail);
      return sendMailBehaviour(mail);
    },
  }),
  resetTransport: () => {},
};

/** Single interception point for both model and transport stubs. */
Module._load = function patchedLoad(request, parent, isMain) {
  if (request.endsWith('utils/mailer')) return mailerStub;

  const modelName = Object.keys(MODEL_STUBS).find((name) => request.endsWith(`models/${name}`));
  if (modelName) return MODEL_STUBS[modelName];

  return originalLoad.call(this, request, parent, isMain);
};

const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const queue = require('../services/queue');

/** Lets the in-process queue drain. */
const settle = async () => {
  for (let i = 0; i < 25; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 12));
  }
};

const reset = () => {
  sentMails = [];
  logs.length = 0;
  notifications.length = 0;
  sendMailBehaviour = async () => ({ messageId: 'mock-1' });
  mailerStub.isConfigured = () => true;
  userByIdResult = null;
  userFindResult = [];
};

test('delivery: a successful send is recorded as SENT', async () => {
  reset();
  const ok = await emailService.send({
    eventType: 'ACCOUNT_WELCOME',
    recipient: { email: 'student@test.local', name: 'Student' },
    data: { name: 'Student', email: 'student@test.local' },
  });

  assert.equal(ok, true);
  await settle();

  assert.equal(sentMails.length, 1);
  assert.equal(sentMails[0].to, 'student@test.local');
  assert.equal(logs[0].status, 'SENT');
  assert.equal(logs[0].attempts, 1);
  assert.ok(logs[0].sentAt);
});

test('delivery: SMTP failure never throws at the caller', async () => {
  reset();
  sendMailBehaviour = async () => {
    const error = new Error('connect ECONNREFUSED');
    error.code = 'ECONNREFUSED';
    throw error;
  };

  // This is the contract that keeps registration/application working.
  const ok = await emailService.send({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipient: { email: 'a@test.local' },
    data: { companyName: 'Acme', jobTitle: 'SDE' },
  });

  assert.equal(ok, true);
  await settle();
  assert.ok(logs.length >= 1);
});

test('delivery: transient failure retries up to EMAIL_MAX_ATTEMPTS', async () => {
  reset();
  let attempts = 0;
  sendMailBehaviour = async () => {
    attempts += 1;
    const error = new Error('timeout');
    error.code = 'ETIMEDOUT';
    throw error;
  };

  await emailService.send({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipient: { email: 'retry@test.local' },
    data: { companyName: 'Acme', jobTitle: 'SDE' },
  });
  await settle();

  assert.equal(attempts, 3, 'should try three times then give up');
  assert.equal(logs[0].status, 'FAILED');
  assert.equal(logs[0].attempts, 3);
  assert.match(logs[0].lastError, /transient/);
});

test('delivery: a transient failure that recovers is not reported as failed', async () => {
  reset();
  let attempts = 0;
  sendMailBehaviour = async () => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error('socket hang up');
      error.code = 'ESOCKET';
      throw error;
    }
    return { messageId: 'recovered' };
  };

  await emailService.send({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipient: { email: 'recover@test.local' },
    data: { companyName: 'Acme', jobTitle: 'SDE' },
  });
  await settle();

  assert.equal(logs[0].status, 'SENT');
  assert.equal(logs[0].attempts, 2);
});

test('delivery: invalid-recipient errors are permanent and not retried', async () => {
  reset();
  let attempts = 0;
  sendMailBehaviour = async () => {
    attempts += 1;
    const error = new Error('550 invalid recipient does not exist');
    error.code = 'EENVELOPE';
    throw error;
  };

  await emailService.send({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipient: { email: 'gone@test.local' },
    data: { companyName: 'Acme', jobTitle: 'SDE' },
  });
  await settle();

  assert.equal(attempts, 1, 'a bad address will never fix itself');
  assert.equal(logs[0].status, 'FAILED');
  assert.match(logs[0].lastError, /^permanent/);
});

test('delivery: an address without @ is skipped without contacting SMTP', async () => {
  reset();
  const ok = await emailService.send({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipient: { email: 'not-an-email' },
    data: {},
  });

  assert.equal(ok, false);
  await settle();
  assert.equal(sentMails.length, 0);
});

test('delivery: SMTP not configured logs SKIPPED instead of failing', async () => {
  reset();
  mailerStub.isConfigured = () => false;

  const ok = await emailService.send({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipient: { email: 'x@test.local' },
    data: {},
  });

  mailerStub.isConfigured = () => true;

  assert.equal(ok, false);
  assert.equal(logs[0].status, 'SKIPPED');
  assert.equal(logs[0].lastError, 'SMTP not configured');
  await settle();
  assert.equal(sentMails.length, 0);
});

test('delivery: sendMany de-duplicates recipients by email', async () => {
  reset();
  const queued = await emailService.sendMany({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipients: [
      { email: 'dup@test.local' },
      { email: 'DUP@test.local' },
      { email: 'dup@test.local' },
      { email: 'other@test.local' },
    ],
    data: () => ({ companyName: 'Acme', jobTitle: 'SDE' }),
  });

  assert.equal(queued, 2);
  await settle();
  assert.equal(sentMails.length, 2);
});

// --- idempotency + RBAC through the orchestrator ---------------------------

const driveFixture = {
  _id: 'drive-1',
  companyName: 'Acme Corp',
  jobTitle: 'SDE-1',
  positionType: 'Full Time',
  workMode: 'Onsite',
  location: 'Bengaluru',
  ctcLpa: 18,
  stipendMonthly: 0,
  deadlineDate: '2026-11-30 18:00',
};

test('idempotency: the same drive event does not notify twice', async () => {
  reset();
  const students = [
    { _id: 's1', userId: 'u1', name: 'One', email: 'one@test.local' },
    { _id: 's2', userId: 'u2', name: 'Two', email: 'two@test.local' },
  ];

  await notificationService.newJobForEligible({ drive: driveFixture, students });
  await settle();
  const firstCount = sentMails.length;
  assert.equal(firstCount, 2);

  // Re-publishing the same drive (double click, retried request) must not
  // produce a second email for the same student.
  await notificationService.newJobForEligible({ drive: driveFixture, students });
  await settle();

  assert.equal(sentMails.length, firstCount, 'no duplicate emails');
  assert.equal(notifications.length, 2, 'no duplicate notifications');
});

test('idempotency: students with no email are skipped, not emailed to nobody', async () => {
  reset();
  await notificationService.newJobForEligible({
    drive: driveFixture,
    students: [{ _id: 's9', userId: 'u9', name: 'NoMail', email: '' }],
  });
  await settle();

  assert.equal(sentMails.length, 0);
  assert.equal(notifications.length, 1, 'the in-app notification still exists');
  assert.match(notifications[0].emailError, /no email address/);
});

// --- regression: per-recipient template data must survive dispatch ---------

test('regression: a drive update reports the real before/after values', async () => {
  reset();
  await notificationService.driveUpdated({
    drive: driveFixture,
    changes: [{ label: 'Deadline', before: '2026-11-30 18:00', after: '2026-12-05 18:00' }],
    applicants: [{ _id: 's1', userId: 'u1', name: 'One', email: 'one@test.local' }],
    newlyEligible: [],
  });
  await settle();

  assert.equal(sentMails.length, 1);
  const mail = sentMails[0];
  assert.match(mail.text, /2026-11-30 18:00 -> 2026-12-05 18:00/);
  assert.doesNotMatch(mail.text, /undefined/, 'no undefined leaked into the body');
  assert.doesNotMatch(mail.subject, /undefined/);

  // The idempotency key must encode the real change, otherwise every update
  // collapses onto one key and real updates are silently suppressed.
  const key = notifications[0].eventKey;
  assert.match(key, /2026-12-05/, `eventKey must include the change: ${key}`);
});

test('regression: per-recipient data is keyed by userId, not student _id', async () => {
  reset();
  await notificationService.deadlineReminder({
    drive: driveFixture,
    students: [{ _id: 's1', userId: 'u1', name: 'One', email: 'one@test.local' }],
    hoursLeft: 24,
  });
  await settle();

  assert.equal(sentMails.length, 1);
  assert.match(sentMails[0].text, /Hi One/, 'the student name reached the template');
});

test('regression: a cancelled drive personalises the reason for each student', async () => {
  reset();
  await notificationService.driveClosed({
    drive: driveFixture,
    applicants: [{ _id: 's1', userId: 'u1', name: 'One', email: 'one@test.local' }],
    reason: 'Company withdrew',
    wasCancelled: true,
  });
  await settle();

  assert.equal(sentMails.length, 1);
  assert.match(sentMails[0].text, /Hi One/);
  assert.match(sentMails[0].text, /Company withdrew/);
});

test('preferences: muting a category suppresses email but keeps in-app', async () => {
  reset();
  userByIdResult = {
    notificationPreferences: { emailNotificationsEnabled: true, mutedCategories: ['jobs'] },
  };

  await notificationService.newJobForEligible({
    drive: driveFixture,
    students: [{ _id: 's1', userId: 'u1', name: 'One', email: 'one@test.local' }],
  });
  await settle();

  assert.equal(sentMails.length, 0, 'muted category must not email');
  assert.equal(notifications.length, 1, 'but the in-app notification stands');
});

test('preferences: security emails ignore the master opt-out', async () => {
  reset();
  userByIdResult = {
    notificationPreferences: { emailNotificationsEnabled: false, mutedCategories: ['jobs', 'profile'] },
  };

  await notificationService.passwordResetRequest(
    { _id: 'u1', email: 'one@test.local', name: 'One' },
    'https://portal.test/reset?token=abc',
    60
  );
  await settle();

  assert.equal(sentMails.length, 1, 'a user cannot opt out of password reset emails');
  assert.ok(sentMails[0].html.includes('token=abc'));
});

test('RBAC: role broadcasts only reach that role', async () => {
  reset();
  userFindResult = [{ _id: 'admin1', email: 'admin@test.local', name: 'Admin' }];

  await notificationService.dispatchToRole({
    eventType: 'SYSTEM_ALERT',
    role: 'super_admin',
    eventKey: 'sys:test-1',
    title: 'SMTP down',
    message: 'SMTP down',
  });
  await settle();

  assert.equal(sentMails.length, 1);
  assert.equal(sentMails[0].to, 'admin@test.local');
});

test('RBAC: a role with no members notifies nobody', async () => {
  reset();
  userFindResult = [];

  const created = await notificationService.dispatchToRole({
    eventType: 'SYSTEM_ALERT',
    role: 'super_admin',
    eventKey: 'sys:test-2',
    title: 'SMTP down',
    message: 'SMTP down',
  });

  assert.deepEqual(created, []);
  await settle();
  assert.equal(sentMails.length, 0);
});

test('RBAC: dispatch with no recipients is a no-op', async () => {
  reset();
  const created = await notificationService.dispatch({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipients: [],
    eventKey: 'drive:x:published',
    title: 't',
    message: 'm',
  });

  assert.deepEqual(created, []);
  assert.equal(sentMails.length, 0);
});

test('dispatch: a missing eventKey is refused rather than duplicating', async () => {
  reset();
  const created = await notificationService.dispatch({
    eventType: 'NEW_JOB_ELIGIBLE',
    recipients: [{ userId: 'u1', email: 'one@test.local', name: 'One' }],
    eventKey: '',
    title: 't',
    message: 'm',
  });

  assert.deepEqual(created, []);
  assert.equal(notifications.length, 0);
});

test('application stage: confidential feedback does not reach the email', async () => {
  reset();
  const application = { _id: 'app1', stageHistory: [{ stageName: 'Applied' }] };
  const studentFixture = { _id: 's1', userId: 'u1', name: 'One', email: 'one@test.local' };

  await notificationService.applicationStageChanged({
    application,
    student: studentFixture,
    drive: driveFixture,
    stage: { _id: 'st1', name: 'Technical Interview' },
    status: 'rejected',
    feedback: 'Poor communication, do not shortlist next time',
    feedbackVisibleToStudent: false,
  });
  await settle();

  assert.equal(sentMails.length, 1);
  assert.equal(
    sentMails[0].html.includes('Poor communication'),
    false,
    'internal feedback must stay internal'
  );

  await notificationService.applicationStageChanged({
    application,
    student: studentFixture,
    drive: driveFixture,
    stage: { _id: 'st2', name: 'HR Interview' },
    status: 'under_review',
    feedback: 'Please bring your transcripts',
    feedbackVisibleToStudent: true,
  });
  await settle();

  assert.equal(sentMails.length, 2);
  assert.ok(sentMails[1].html.includes('Please bring your transcripts'));
});

test('application stage: selection is announced as an offer', async () => {
  reset();
  await notificationService.applicationStageChanged({
    application: { _id: 'app2', stageHistory: [] },
    student: { _id: 's2', userId: 'u2', name: 'Two', email: 'two@test.local' },
    drive: driveFixture,
    stage: { _id: 'st9', name: 'Offer' },
    status: 'offered',
  });
  await settle();

  assert.equal(sentMails.length, 1);
  assert.match(sentMails[0].subject, /Selected/i);
});

test('interview: a scheduled round carries the venue/link and date', async () => {
  reset();
  await notificationService.interviewEvent({
    application: { _id: 'app3', stageHistory: [] },
    student: { _id: 's3', userId: 'u3', name: 'Three', email: 'three@test.local' },
    drive: driveFixture,
    stage: {
      _id: 'st10',
      name: 'Technical Interview',
      type: 'technical_interview',
      scheduledDate: '2026-11-20 10:00',
      venueOrLink: 'https://meet.example.com/xyz',
      notes: 'Bring your ID card',
    },
    kind: 'scheduled',
  });
  await settle();

  assert.equal(sentMails.length, 1);
  assert.ok(sentMails[0].html.includes('https://meet.example.com/xyz'));
  assert.ok(sentMails[0].html.includes('Bring your ID card'));
});

test('queue: a throwing job never escapes as an unhandled rejection', async () => {
  reset();
  const enqueued = queue.enqueue(async () => {
    throw new Error('boom');
  });

  assert.equal(enqueued, true);
  await settle();
  // Reaching here without an unhandled rejection is the assertion.
  assert.ok(true);
});

test('cleanup: restore the module loader', () => {
  Module._load = originalLoad;
  assert.ok(true);
});
