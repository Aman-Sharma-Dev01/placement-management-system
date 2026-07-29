const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

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
    const { name, email, password, role, rollNo, branch, department, batchYear, gender, category, phone } = req.body;

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

      await Student.create({
        userId: user._id,
        name,
        email,
        phone: phone || '',
        rollNo,
        branch,
        department: department || '',
        batchYear,
        gender,
        category: category || 'General',
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
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe };
