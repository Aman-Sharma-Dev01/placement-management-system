const Student = require('../models/Student');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all students (with filtering)
// @route   GET /api/students
// @access  Private (coordinator, cell, admin)
const getStudents = async (req, res) => {
  try {
    const {
      search,
      branch,
      verificationStatus,
      batchYear,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (branch) query.branch = branch;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (batchYear) query.batchYear = Number(batchYear);

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Student.countDocuments(query);

    res.json({ students, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student profile for current logged-in student
// @route   GET /api/students/me
// @access  Private (student)
const getMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private (owner student, coordinator, admin)
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Students can only edit their own profile
    if (req.user.role === 'student' && student.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this profile' });
    }

    // Don't let verified students edit their own profile
    if (
      req.user.role === 'student' &&
      student.verificationStatus === 'verified'
    ) {
      return res.status(400).json({
        message:
          'Your profile is locked after verification. Contact placement coordinator for corrections.',
      });
    }

    // Calculate Profile Completion Percentage
    let profileCompletionPercentage = 30; // base
    const dataToCalculate = { ...student.toObject(), ...req.body };
    
    if (dataToCalculate.phone) profileCompletionPercentage += 10;
    if (dataToCalculate.education?.tenth?.percentage) profileCompletionPercentage += 10;
    if (dataToCalculate.education?.twelfth?.percentage) profileCompletionPercentage += 10;
    if (dataToCalculate.education?.graduation?.cgpa) profileCompletionPercentage += 15;
    if (dataToCalculate.skills && dataToCalculate.skills.length > 0) profileCompletionPercentage += 10;
    if (dataToCalculate.projects && dataToCalculate.projects.length > 0) profileCompletionPercentage += 10;
    if (dataToCalculate.resumes && dataToCalculate.resumes.length > 0) profileCompletionPercentage += 5;
    if (dataToCalculate.internships && dataToCalculate.internships.length > 0) profileCompletionPercentage += 5;
    
    profileCompletionPercentage = Math.min(100, profileCompletionPercentage);
    req.body.profileCompletionPercentage = profileCompletionPercentage;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Also update user name/avatar if changed
    if (req.body.name || req.body.avatarUrl) {
      const updateFields = {};
      if (req.body.name) updateFields.name = req.body.name;
      if (req.body.avatarUrl) updateFields.avatarUrl = req.body.avatarUrl;
      await User.findByIdAndUpdate(student.userId, updateFields);
    }

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify/reject student profile
// @route   PATCH /api/students/:id/verify
// @access  Private (coordinator, admin)
const verifyStudent = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['verified', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: status,
        coordinatorRemarks: remarks || '',
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Send notification to student
    await Notification.create({
      userId: student.userId,
      title: `Profile ${status === 'verified' ? 'Verified' : status === 'rejected' ? 'Rejected' : 'Under Review'}`,
      message: remarks || `Your profile has been ${status} by the placement coordinator.`,
      type: 'verification',
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk verify students
// @route   PATCH /api/students/bulk-verify
// @access  Private (coordinator, admin)
const bulkVerifyStudents = async (req, res) => {
  try {
    const { studentIds, status } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Please provide studentIds array' });
    }

    await Student.updateMany(
      { _id: { $in: studentIds } },
      { verificationStatus: status }
    );

    // Create notifications for all students
    const students = await Student.find({ _id: { $in: studentIds } });
    const notifications = students.map((s) => ({
      userId: s.userId,
      title: `Profile Bulk ${status}`,
      message: `Your profile has been ${status} by the placement coordinator.`,
      type: 'verification',
    }));
    await Notification.insertMany(notifications);

    res.json({ message: `${studentIds.length} students marked as ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  getMyProfile,
  updateStudent,
  verifyStudent,
  bulkVerifyStudents,
};
