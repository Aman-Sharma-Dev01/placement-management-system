const mongoose = require('mongoose');

const hiringStageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'pre_placement_talk',
        'online_test',
        'resume_shortlist',
        'group_discussion',
        'technical_interview',
        'hr_interview',
      ],
      required: true,
    },
    scheduledDate: { type: String, default: '' },
    venueOrLink: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const eligibilityRulesSchema = new mongoose.Schema(
  {
    allowedBranches: { type: [String], default: [] },
    minCgpa: { type: Number, default: 0 },
    minTenthPercentage: { type: Number, default: 0 },
    minTwelfthPercentage: { type: Number, default: 0 },
    maxActiveBacklogs: { type: Number, default: 0 },
    maxHistoryBacklogs: { type: Number, default: 0 },
    maxGapYears: { type: Number, default: 0 },
    allowedCategories: { type: [String], default: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
    maxExistingOffers: { type: Number, default: 1 },
    offerCategoryRestriction: { type: String, default: '' },
  },
  { _id: false }
);

const placementDriveSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    companyName: { type: String, required: true },
    companyLogo: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },
    sector: { type: String, default: '' },
    jobTitle: { type: String, required: true },
    positionType: {
      type: String,
      enum: ['Full Time', 'Internship', 'Internship + PPO', 'Contractual'],
      required: true,
    },
    jobFunction: { type: String, default: '' },
    location: { type: String, default: '' },
    workMode: {
      type: String,
      enum: ['Onsite', 'Remote', 'Hybrid'],
      default: 'Onsite',
    },
    ctcLpa: { type: Number, required: true },
    stipendMonthly: { type: Number, default: 0 },
    description: { type: String, default: '' },
    requirements: { type: [String], default: [] },
    probationPeriodMonths: { type: Number, default: 0 },
    compensationDetails: { type: String, default: '' },

    status: {
      type: String,
      enum: ['open', 'closed', 'upcoming', 'draft'],
      default: 'open',
    },
    postedDate: { type: String, default: '' },
    deadlineDate: { type: String, default: '' },

    eligibility: { type: eligibilityRulesSchema, default: () => ({}) },
    stages: { type: [hiringStageSchema], default: [] },
    requiredDocuments: { type: [String], default: [] },
    externalApplyUrl: { type: String, default: '' },
    importantNotice: { type: String, default: '' },

    totalEligibleStudentsCount: { type: Number, default: 0 },
    totalAppliedCount: { type: Number, default: 0 },
    shortlistedCount: { type: Number, default: 0 },
    selectedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);
