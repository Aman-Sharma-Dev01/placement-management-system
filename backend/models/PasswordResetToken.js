const mongoose = require('mongoose');

/**
 * Hashed, single-use password reset tokens.
 *
 * The raw token only ever exists inside the reset email — we persist just
 * its SHA-256 hash, so a database leak cannot be used to reset anyone's
 * password.
 */
const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    requestIp: { type: String, default: '' },
  },
  { timestamps: true }
);

// Mongo removes expired documents automatically.
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetTokenSchema.index({ tokenHash: 1 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);