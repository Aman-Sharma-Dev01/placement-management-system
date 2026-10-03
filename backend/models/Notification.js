const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetRole: {
      type: String,
      enum: ['student', 'placement_coordinator', 'placement_cell', 'super_admin', null],
      default: null,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        // Kept for backwards compatibility with notifications created
        // before the email system existed.
        'drive',
        'verification',
        'interview',
        'offer',
        // Added by the notification system.
        'application',
        'account',
        'system',
      ],
      default: 'drive',
    },
    linkDriveId: { type: String, default: '' },

    // --- Added by the notification system -------------------------------
    // Priority drives which notifications are worth an email and which are
    // in-app only.
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
      default: 'NORMAL',
    },
    // Idempotency key. Sparse + unique so the same business event can never
    // produce two notifications (and therefore never two emails).
    eventKey: { type: String, default: undefined },
    // Generic link target so notifications can deep-link beyond a drive.
    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },

    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },

    // Delivery state for the email channel. `read`/`readAt` above remain
    // the in-app channel.
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    emailError: { type: String, default: '' },
    emailAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Drives the in-app notification feed.
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ targetRole: 1, createdAt: -1 });
// Sparse so the many notifications without an eventKey are allowed, while
// guaranteeing one notification per business event.
notificationSchema.index({ eventKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);