const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { allocateSupersetId } = require('../utils/supersetId');
const { verifyGoogleIdToken } = require('../utils/googleVerify');
const passwordResetService = require('../services/passwordResetService');
const PasswordResetToken = require('../models/PasswordResetToken');
const notificationService = require('../services/notificationService');
const { portalUrl } = require('../emailTemplates/layout');

/**
 * Generic response for every password reset request, whether or not the email
 * exists. Returning the same thing in both cases stops this endpoint being used
 * to enumerate which addresses have accounts.
 */
const RESET_GENERIC_MESSAGE =
  'If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder.';

// Stronger than the registration minimum, and enforced here rather than in the
// schema so existing short passwords keep working.
const validateNewPassword = (password) => {
  if (!password || typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return null;
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, rollNo, branch, department, batchYear, gender, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Only super_admin can create non-student accounts
    // For public registration, default to student
    const userRole = role || 'student';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    // If student, create student profile automatically
    if (userRole === 'student') {
      if (!rollNo || !branch || !batchYear || !gender) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          message: 'Student registration requires rollNo, branch, batchYear, and gender',
        });
      }

      const student = await Student.create({
        userId: user._id,
        name,
        email,
        phone: phone || '',
        rollNo,
        branch,
        department: department || '',
        batchYear,
        gender,
        verificationStatus: 'pending',
        profileCompletionPercentage: 30,
        education: {
          tenth: { institution: '', board: '', percentage: 0, passingYear: 0 },
          twelfthOrDiploma: 'twelfth',
          twelfth: { institution: '', board: '', percentage: 0, passingYear: 0 },
          diploma: { institution: '', board: '', percentage: 0, passingYear: 0 },
          graduation: {
            university: '',
            branch: branch,
            cgpa: 0,
            sgpaPerSemester: [],
            passingYear: batchYear,
            backlogs: { active: 0, history: 0 },
            gapYears: 0,
          },
        },
      });

      try {
        await allocateSupersetId(student);
      } catch (idError) {
        // Never block registration on ID issuance. Any gap left here is
        // repaired later by `npm run assign-ids`.
        console.error('Superset ID allocation failed:', idError.message);
      }
    }

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      token,
    });

    // Welcome email after the response, so SMTP latency never delays signup.
    notificationService.accountWelcome(user).catch((error) => {
      console.error('Welcome notification failed:', error.message);
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const normalised = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalised });

    // Silent success path: a miss looks exactly like a hit from the outside.
    if (!user) {
      console.log(`[forgotPassword] No account for ${normalised} — responding generically`);
      return res.json({ message: RESET_GENERIC_MESSAGE });
    }

    const { rawToken, ttlMinutes } = await passwordResetService.issue({
      userId: user._id,
      requestIp: req.ip || '',
    });
    await passwordResetService.enforceCap(user._id);

    await notificationService.passwordResetRequest(
      user,
      portalUrl(`/reset-password?token=${encodeURIComponent(rawToken)}`),
      ttlMinutes
    );

    res.json({ message: RESET_GENERIC_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Even on failure, do not reveal whether the account exists.
    res.json({ message: RESET_GENERIC_MESSAGE });
  }
};

// @desc    Validate a reset token before showing the new-password form
// @route   GET /api/auth/reset-password/:token
// @access  Public
const validateResetToken = async (req, res) => {
  try {
    const { valid, reason } = await passwordResetService.find(req.params.token);
    res.json({ valid, reason });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({ message: 'Could not validate this reset link' });
  }
};

// @desc    Set a new password using a reset token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const invalid = validateNewPassword(password);
    if (invalid) {
      return res.status(400).json({ message: invalid });
    }

    // Consuming is atomic: a second click on the same link fails here.
    const result = await passwordResetService.consume(req.params.token);
    if (!result.valid) {
      return res.status(400).json({
        message:
          'This reset link is invalid, has expired, or has already been used. Please request a new one.',
      });
    }

    const user = await User.findById(result.user._id);
    if (!user) {
      return res.status(400).json({ message: 'This reset link is no longer valid' });
    }

    // `save()` (not findOneAndUpdate) so the bcrypt pre-save hook runs.
    user.password = password;
    await user.save();

    // Kill any other live reset links for this account.
    await PasswordResetToken.updateMany(
      { userId: user._id, usedAt: null },
      { $set: { usedAt: new Date() } }
    ).catch(() => {});

    res.json({
      message: 'Your password has been reset. You can now sign in with your new password.',
    });

    notificationService.passwordChanged(user).catch((error) => {
      console.error('Password-change notification failed:', error.message);
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Could not reset your password. Please try again.' });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sign in (or sign up) with a Google ID token
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google sign-in is not configured on this server' });
    }

    const profile = await verifyGoogleIdToken(credential, process.env.GOOGLE_CLIENT_ID);

    let user = await User.findOne({ googleId: profile.sub });
    let linkedExistingAccount = false;

    if (!user) {
      const existing = await User.findOne({ email: profile.email });

      if (existing) {
        if (existing.googleId && existing.googleId !== profile.sub) {
          return res.status(409).json({
            message: 'This email is already linked to a different Google account',
          });
        }

        existing.googleId = profile.sub;
        if (!existing.avatarUrl && profile.picture) {
          existing.avatarUrl = profile.picture;
        }
        await existing.save();
        user = existing;
        linkedExistingAccount = true;
      }
    }

    let isNewGoogleUser = false;
    if (!user) {
      user = await User.create({
        name: profile.name,
        email: profile.email,
        // Google users never use password login. A random secret keeps the
        // existing `required` constraint satisfied without being guessable.
        password: crypto.randomBytes(24).toString('hex'),
        role: 'student',
        googleId: profile.sub,
        avatarUrl: profile.picture || '',
      });
      isNewGoogleUser = true;
    }

    const studentProfile =
      user.role === 'student' ? await Student.findOne({ userId: user._id }) : null;

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      token: generateToken(user._id),
      studentProfile,
      needsOnboarding: user.role === 'student' && !studentProfile,
      linkedExistingAccount,
    });

    // Same welcome path as password registration, so Google-only students also
    // receive onboarding instructions.
    if (isNewGoogleUser) {
      notificationService.accountWelcome(user).catch((error) => {
        console.error('Google welcome notification failed:', error.message);
      });
    }
  } catch (error) {
    console.error('Google login error:', error.message);
    res.status(401).json({ message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let studentProfile = null;

    if (user.role === 'student') {
      studentProfile = await Student.findOne({ userId: user._id });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      studentProfile,
      needsOnboarding: user.role === 'student' && !studentProfile,
      notificationPreferences: user.notificationPreferences,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update email notification preferences
// @route   PATCH /api/auth/notification-preferences
// @access  Private
const updateNotificationPreferences = async (req, res) => {
  try {
    const { emailNotificationsEnabled, mutedCategories } = req.body;
    const allowed = ['jobs', 'applications', 'interviews', 'profile'];

    const update = {};

    if (typeof emailNotificationsEnabled === 'boolean') {
      update['notificationPreferences.emailNotificationsEnabled'] = emailNotificationsEnabled;
    }

    if (Array.isArray(mutedCategories)) {
      const clean = mutedCategories.filter((item) => allowed.includes(item));
      update['notificationPreferences.mutedCategories'] = clean;
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });

    res.json({ notificationPreferences: user.notificationPreferences });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  forgotPassword,
  validateResetToken,
  resetPassword,
  updateNotificationPreferences,
};
