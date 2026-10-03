const mongoose = require('mongoose');

const STATUSES = ['QUEUED', 'SENDING', 'SENT', 'FAILED', 'RETRYING', 'SKIPPED'];

/**
 * One row per outbound email attempt chain. Deliberately stores no email
 * body — only routing metadata, so logs never become a place where
 * passwords or confidential content can leak.
 */
const emailLogSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recipient: { type: String, required: true },
    recipientName: { type: String, default: '' },
    eventType: { type: String, required: true },
    eventKey: { type: String, default: '' },
    subject: { type: String, default: '' },

    status: { type: String, enum: STATUSES, default: 'QUEUED' },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: { type: String, default: '' },

    provider: { type: String, default: 'smtp' },
    messageId: { type: String, default: '' },

    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },

    queuedAt: { type: Date, default: Date.now },
    sentAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ recipient: 1, createdAt: -1 });
emailLogSchema.index({ eventKey: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
module.exports.STATUSES = STATUSES;