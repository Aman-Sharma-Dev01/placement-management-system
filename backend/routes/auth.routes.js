const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  getMe,
  forgotPassword,
  validateResetToken,
  resetPassword,
  updateNotificationPreferences,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const { createLimiter, auth, registration, passwordReset } = require('../middleware/rateLimit');

// Registration gets a counting-only bucket so a successful sign-up still costs
// an attempt; `auth` refunds successes and is right for login/Google only.
router.post('/register', registration, register);
router.post('/login', auth, login);
router.post('/google', auth, googleLogin);

// Password reset. Tighter limiter, and it counts *requests* rather than
// failures — a successful response still means an email was attempted.
router.post('/forgot-password', passwordReset, forgotPassword);
router.get('/reset-password/:token', createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  name: 'reset-token-lookup',
  message: 'Too many attempts. Please request a fresh reset link.',
}), validateResetToken);
router.post('/reset-password/:token', passwordReset, resetPassword);

router.get('/me', protect, getMe);
router.patch('/notification-preferences', protect, updateNotificationPreferences);

module.exports = router;
