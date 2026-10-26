const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    // e.g. "2023-2027" or "Batch 2027"
    name: { type: String, required: true, unique: true },
    // The graduation year (the year students pass out)
    passingYear: { type: Number, required: true, unique: true },
    // The admission year
    admissionYear: { type: Number, required: true },
    program: { type: String, default: 'B.Tech' },
    description: { type: String, default: '' },

    // Enrollment window control
    isEnrollmentOpen: { type: Boolean, default: false },
    enrollmentOpenedAt: { type: String, default: '' },
    enrollmentClosedAt: { type: String, default: '' },

    // Cached counts — refreshed when students enroll/unenroll
    totalStudentsCount: { type: Number, default: 0 },
    enrolledStudentsCount: { type: Number, default: 0 },
    placedStudentsCount: { type: Number, default: 0 },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Batch', batchSchema);
