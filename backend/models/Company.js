const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    website: { type: String, default: '' },
    sector: { type: String, default: '' },
    tier: {
      type: String,
      enum: ['Super Dream (>12 LPA)', 'Dream (6-12 LPA)', 'Core', 'Mass Recruiter'],
      default: 'Core',
    },
    mouStatus: {
      type: String,
      enum: ['Active MoU', 'Under Renewal', 'New Partner'],
      default: 'New Partner',
    },
    activeDrivesCount: { type: Number, default: 0 },
    totalHired: { type: Number, default: 0 },
    avgCtc: { type: Number, default: 0 },
    contactPerson: {
      name: { type: String, default: '' },
      role: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
