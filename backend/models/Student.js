const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    supersetId: { type: String, default: '' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    rollNo: { type: String, required: true, unique: true },
    branch: { type: String, required: true },
    department: { type: String, default: '' },
    batchYear: { type: Number, required: true },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    category: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'EWS'],
      default: 'General',
    },

    // Verification
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'rejected', 'draft'],
      default: 'pending',
    },
    coordinatorRemarks: { type: String, default: '' },
    profileCompletionPercentage: { type: Number, default: 0 },

    // Education
    education: {
      tenth: {
        institution: { type: String, default: '' },
        board: { type: String, default: '' },
        percentage: { type: Number, default: 0 },
        passingYear: { type: Number, default: 0 },
        marksheetUrl: { type: String, default: '' },
      },
      twelfthOrDiploma: { type: String, enum: ['twelfth', 'diploma'], default: 'twelfth' },
      twelfth: {
        institution: { type: String, default: '' },
        board: { type: String, default: '' },
        percentage: { type: Number, default: 0 },
        passingYear: { type: Number, default: 0 },
        marksheetUrl: { type: String, default: '' },
      },
      diploma: {
        institution: { type: String, default: '' },
        board: { type: String, default: '' },
        percentage: { type: Number, default: 0 },
        passingYear: { type: Number, default: 0 },
        marksheetUrl: { type: String, default: '' },
      },
      graduation: {
        university: { type: String, default: '' },
        branch: { type: String, default: '' },
        cgpa: { type: Number, default: 0 },
        sgpaPerSemester: { type: [Number], default: [] },
        passingYear: { type: Number, default: 0 },
        backlogs: {
          active: { type: Number, default: 0 },
          history: { type: Number, default: 0 },
        },
        gapYears: { type: Number, default: 0 },
        gapReason: { type: String, default: '' },
      },
    },

    // Skills & Extras
    skills: { type: [String], default: [] },
    projects: [
      {
        title: { type: String },
        description: { type: String },
        techStack: { type: [String], default: [] },
        link: { type: String, default: '' },
      },
    ],
    internships: [
      {
        company: { type: String },
        role: { type: String },
        duration: { type: String },
        description: { type: String },
        certificateUrl: { type: String, default: '' },
      },
    ],
    certificates: [
      {
        title: { type: String },
        issuer: { type: String },
        issueDate: { type: String },
        credentialUrl: { type: String, default: '' },
      },
    ],
    resumes: [
      {
        name: { type: String },
        isPrimary: { type: Boolean, default: false },
        uploadedAt: { type: String },
        fileUrl: { type: String },
      },
    ],
    appliedDriveIds: { type: [String], default: [] },
    offers: [
      {
        companyName: { type: String },
        role: { type: String },
        ctc: { type: Number },
        offerDate: { type: String },
        status: {
          type: String,
          enum: ['accepted', 'pending', 'declined'],
          default: 'pending',
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
