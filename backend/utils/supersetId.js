const mongoose = require('mongoose');
const Student = require('../models/Student');

const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const PADDING = 4;
const MAX_ATTEMPTS = 5;

const counterKey = (year) => `supersetId:${year}`;
const idPrefix = (year) => `SSP-${year}-`;

const currentYear = () => new Date().getFullYear();

const formatSupersetId = (year, seq) =>
  `${idPrefix(year)}${String(seq).padStart(PADDING, '0')}`;

const isBlank = (value) => value === '' || value === null || typeof value === 'undefined';

const blankSupersetFilter = () => ({
  $or: [{ supersetId: '' }, { supersetId: null }, { supersetId: { $exists: false } }],
});

// Highest sequence number already present in the students collection for
// the given year. Scanned in full rather than sorted, because zero-padded
// strings do not sort into numeric order.
const readMaxIssuedSeq = async (year) => {
  const escapedYear = String(year).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${idPrefix(year).replace(/[-]/g, '\\-')}\\d+$`);

  let max = 0;
  const cursor = Student.find({ supersetId: pattern }).select('supersetId').lean().cursor();

  for await (const doc of cursor) {
    const seq = parseInt(doc.supersetId.slice(idPrefix(year).length), 10);
    if (Number.isFinite(seq) && seq > max) {
      max = seq;
    }
  }

  return max;
};

// $max + upsert is atomic and idempotent: it never lowers a healthy
// counter, and it creates the document when it is missing. Without the
// upsert a rebuilt counter would restart at 1 and re-issue live IDs.
const raiseCounterTo = async (year, seq) => {
  if (!Number.isFinite(seq) || seq <= 0) return;
  await Counter.updateOne(
    { key: counterKey(year) },
    { $max: { seq } },
    { upsert: true, setDefaultsOnInsert: true }
  );
};

// Advances the shared sequence atomically, so concurrent registrations
// can never receive the same number.
const nextSeq = async (year) => {
  const doc = await Counter.findOneAndUpdate(
    { key: counterKey(year) },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
};

// Assigns an ID to a single already-persisted student, without ever
// overwriting an ID that has already been issued. Idempotent: calling it
// again on a student that already holds an ID returns that ID untouched.
const allocateSupersetId = async (student) => {
  const year = currentYear();

  const onDisk = await Student.findById(student._id).select('supersetId').lean();
  if (onDisk && !isBlank(onDisk.supersetId)) {
    return onDisk.supersetId;
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const supersetId = formatSupersetId(year, await nextSeq(year));
    const result = await Student.updateOne(
      { _id: student._id, ...blankSupersetFilter() },
      { $set: { supersetId } }
    );

    if (result.modifiedCount === 1) {
      return supersetId;
    }
  }

  throw new Error('Unable to allocate a unique Superset ID');
};

// Keeps the counter ahead of every ID that already exists in the students
// collection, so a rebuilt or stale counter can never re-issue an ID.
const syncSupersetCounter = async (year = currentYear()) => {
  const maxIssued = await readMaxIssuedSeq(year);
  await raiseCounterTo(year, maxIssued);
  const counter = await Counter.findOne({ key: counterKey(year) }).lean();
  return { year, maxIssued, counterSeq: counter ? counter.seq : 0 };
};

module.exports = {
  currentYear,
  formatSupersetId,
  allocateSupersetId,
  syncSupersetCounter,
};
