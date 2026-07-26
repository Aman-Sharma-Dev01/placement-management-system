const mongoose = require('mongoose');

const stageHistorySchema = new mongoose.Schema(
  {
    stageId: { type: String, required: true },
    stageName: { type: String, required: true },
    updatedAt: { type: String, default: '' },
    status: {
      type: String,
      enum: ['passed', 'failed', 'pending'],
      default: 'pending',
    },
    feedback: { type: String, default: '' },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    appliedAt: { type: String, default: '' },
    currentStageId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['applied', 'under_review', 'shortlisted', 'offered', 'rejected', 'withdrawn'],
      default: 'applied',
    },
    selectedResumeId: { type: String, default: '' },
    stageHistory: { type: [stageHistorySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
