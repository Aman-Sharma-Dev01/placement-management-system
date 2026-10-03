const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: __dirname + '/../.env' });

const Student = require('../models/Student');
const connectDB = require('../config/db');
const { allocateSupersetId, syncSupersetCounter } = require('./supersetId');

const assignSupersetIds = async () => {
  try {
    await connectDB();

    const sync = await syncSupersetCounter();
    console.log(`Counter sync for ${sync.year}: highest issued SSP-${sync.year}-#### = ${sync.maxIssued}, counter now at ${sync.counterSeq}`);
    console.log('');

    const pending = await Student.find({
      $or: [{ supersetId: '' }, { supersetId: null }, { supersetId: { $exists: false } }],
    })
      .sort({ createdAt: 1, _id: 1 })
      .select('_id name rollNo supersetId');

    if (pending.length === 0) {
      console.log('Nothing to do - every student already has a Superset ID.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`Found ${pending.length} student(s) without a Superset ID. Assigning...\n`);

    let assigned = 0;
    let failed = 0;

    for (const student of pending) {
      try {
        const supersetId = await allocateSupersetId(student);
        assigned += 1;
        console.log(`  ${supersetId}  ->  ${student.name} (${student.rollNo})`);
      } catch (error) {
        failed += 1;
        console.error(`  FAILED      ->  ${student.name} (${student.rollNo}): ${error.message}`);
      }
    }

    console.log('');
    console.log(`Done. Assigned: ${assigned}, Failed: ${failed}`);
    console.log('Existing Superset IDs were left untouched.');

    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Superset ID assignment error:', error.message);
    process.exit(1);
  }
};

assignSupersetIds();
