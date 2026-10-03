const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const { allocateSupersetId } = require('../utils/supersetId');
const { verifyGoogleIdToken } = require('../utils/googleVerify');

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
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
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
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, googleLogin, getMe };
