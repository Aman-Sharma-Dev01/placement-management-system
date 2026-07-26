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
      enum: ['drive', 'verification', 'interview', 'offer'],
      default: 'drive',
    },
    linkDriveId: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
