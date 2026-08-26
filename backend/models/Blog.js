const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: { type: String, default: 'Placement Cell' }, // For easy display
    relatedDriveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      default: null,
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students'],
      default: 'all',
    },
    isImportant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
