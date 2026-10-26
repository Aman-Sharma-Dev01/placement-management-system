const Batch = require('../models/Batch');
const Student = require('../models/Student');
const Application = require('../models/Application');
const PlacementDrive = require('../models/PlacementDrive');

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private
const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ isActive: true }).sort({ passingYear: -1 });
    // Attach live enrolled count to each batch
    const withCounts = await Promise.all(
      batches.map(async (b) => {
        const enrolledCount = await Student.countDocuments({ enrolledBatchId: b._id });
        return { ...b.toObject(), enrolledStudentsCount: enrolledCount };
      })
    );
    res.json(withCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new batch
// @route   POST /api/batches
// @access  Private (placement_cell, super_admin)
const createBatch = async (req, res) => {
  try {
    const { name, passingYear, admissionYear, program, description } = req.body;

    if (!name || !passingYear || !admissionYear) {
      return res.status(400).json({ message: 'name, passingYear and admissionYear are required' });
    }

    const existing = await Batch.findOne({ passingYear: Number(passingYear) });
    if (existing) {
      return res.status(400).json({ message: `A batch for passing year ${passingYear} already exists` });
    }

    const batch = await Batch.create({
      name,
      passingYear: Number(passingYear),
      admissionYear: Number(admissionYear),
      program: program || 'B.Tech',
      description: description || '',
      createdBy: req.user._id,
    });

    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a batch (toggle enrollment, update details)
// @route   PUT /api/batches/:id
// @access  Private (placement_cell, super_admin)
const updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle enrollment open/close for a batch
// @route   PATCH /api/batches/:id/toggle-enrollment
// @access  Private (placement_cell, super_admin)
const toggleEnrollment = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    batch.isEnrollmentOpen = !batch.isEnrollmentOpen;
    if (batch.isEnrollmentOpen) {
      batch.enrollmentOpenedAt = new Date().toISOString();
    } else {
      batch.enrollmentClosedAt = new Date().toISOString();
    }
    await batch.save();
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Student enrolls into a batch
// @route   POST /api/batches/:id/enroll
// @access  Private (student)
const enrollInBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    if (!batch.isEnrollmentOpen) {
      return res.status(400).json({ message: 'Enrollment is currently closed for this batch' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    if (student.verificationStatus !== 'verified') {
      return res.status(403).json({ message: 'Your profile must be verified before enrolling' });
    }
    if (student.batchEnrollmentStatus === 'enrolled') {
      return res.status(400).json({ message: 'You are already enrolled in a batch' });
    }

    // Verify the batch's passing year matches the student's batchYear
    if (batch.passingYear !== student.batchYear) {
      return res.status(400).json({
        message: `This batch is for passing year ${batch.passingYear}, but your profile shows ${student.batchYear}`,
      });
    }

    student.enrolledBatchId = batch._id;
    student.batchEnrollmentStatus = 'enrolled';
    await student.save();

    res.json({ message: 'Enrolled successfully', batch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get analytics for a specific batch
// @route   GET /api/batches/:id/analytics
// @access  Private (placement_cell, placement_coordinator, super_admin)
const getBatchAnalytics = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // All students enrolled in this batch
    const allEnrolledStudents = await Student.find({ enrolledBatchId: batch._id }).lean();
    const enrolledIds = allEnrolledStudents.map((s) => s._id);

    // All drives targeting this batch
    const batchDrives = await PlacementDrive.find({
      $or: [
        { 'eligibility.targetBatchIds': batch._id },
        { 'eligibility.allowedBatchYears': batch.passingYear },
      ],
    }).lean();
    const driveIds = batchDrives.map((d) => d._id);

    // Applications by enrolled students for batch drives
    const allApplications = await Application.find({
      driveId: { $in: driveIds },
      studentId: { $in: enrolledIds },
    })
      .populate('studentId', 'name rollNo branch email batchYear')
      .populate('driveId', 'companyName jobTitle ctcLpa positionType')
      .lean();

    // Offered/placed students
    const offeredApps = allApplications.filter((a) => a.status === 'offered');
    const placedStudentIds = new Set(offeredApps.map((a) => a.studentId?._id?.toString()));

    // Unplaced enrolled students
    const unplacedStudents = allEnrolledStudents.filter(
      (s) => !placedStudentIds.has(s._id.toString())
    );

    // Students who applied but are not yet placed
    const appliedStudentIds = new Set(allApplications.map((a) => a.studentId?._id?.toString()));
    const notAppliedStudents = allEnrolledStudents.filter(
      (s) => !appliedStudentIds.has(s._id.toString())
    );

    // CTC stats from offered apps
    const ctcValues = offeredApps
      .map((a) => a.driveId?.ctcLpa)
      .filter((v) => typeof v === 'number' && v > 0);
    const avgCtc = ctcValues.length ? ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length : 0;
    const highestCtc = ctcValues.length ? Math.max(...ctcValues) : 0;
    const lowestCtc = ctcValues.length ? Math.min(...ctcValues) : 0;

    // Branch-wise breakdown
    const branchMap = {};
    for (const s of allEnrolledStudents) {
      if (!branchMap[s.branch]) branchMap[s.branch] = { branch: s.branch, total: 0, placed: 0, applied: 0 };
      branchMap[s.branch].total++;
      if (placedStudentIds.has(s._id.toString())) branchMap[s.branch].placed++;
      if (appliedStudentIds.has(s._id.toString())) branchMap[s.branch].applied++;
    }
    const branchWise = Object.values(branchMap);

    // Company-wise placements
    const companyMap = {};
    for (const app of offeredApps) {
      const name = app.driveId?.companyName || 'Unknown';
      if (!companyMap[name]) companyMap[name] = { company: name, count: 0, ctc: [] };
      companyMap[name].count++;
      if (app.driveId?.ctcLpa) companyMap[name].ctc.push(app.driveId.ctcLpa);
    }
    const companyWise = Object.values(companyMap).map((c) => ({
      company: c.company,
      count: c.count,
      avgCtc: c.ctc.length ? (c.ctc.reduce((a, b) => a + b, 0) / c.ctc.length).toFixed(2) : 0,
    }));

    // Salary bracket distribution
    const brackets = [
      { range: '< 5 LPA', min: 0, max: 5 },
      { range: '5-8 LPA', min: 5, max: 8 },
      { range: '8-12 LPA', min: 8, max: 12 },
      { range: '> 12 LPA', min: 12, max: Infinity },
    ];
    const salaryBrackets = brackets.map((b) => ({
      range: b.range,
      count: ctcValues.filter((v) => v >= b.min && v < b.max).length,
    }));

    res.json({
      batch,
      summary: {
        totalEnrolled: allEnrolledStudents.length,
        totalPlaced: placedStudentIds.size,
        totalUnplaced: unplacedStudents.length,
        totalApplied: appliedStudentIds.size,
        notApplied: notAppliedStudents.length,
        totalDrives: batchDrives.length,
        totalApplications: allApplications.length,
        avgCtc: parseFloat(avgCtc.toFixed(2)),
        highestCtc,
        lowestCtc,
        placementRate:
          allEnrolledStudents.length > 0
            ? parseFloat(((placedStudentIds.size / allEnrolledStudents.length) * 100).toFixed(1))
            : 0,
      },
      branchWise,
      companyWise,
      salaryBrackets,
      drives: batchDrives,
      // Exportable lists
      placedStudents: allEnrolledStudents
        .filter((s) => placedStudentIds.has(s._id.toString()))
        .map((s) => ({
          _id: s._id,
          name: s.name,
          email: s.email,
          rollNo: s.rollNo,
          branch: s.branch,
          batchYear: s.batchYear,
        })),
      unplacedStudents: unplacedStudents.map((s) => ({
        _id: s._id,
        name: s.name,
        email: s.email,
        rollNo: s.rollNo,
        branch: s.branch,
        batchYear: s.batchYear,
      })),
      notAppliedStudents: notAppliedStudents.map((s) => ({
        _id: s._id,
        name: s.name,
        email: s.email,
        rollNo: s.rollNo,
        branch: s.branch,
        batchYear: s.batchYear,
      })),
    });
  } catch (error) {
    console.error('Batch analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBatches,
  createBatch,
  updateBatch,
  toggleEnrollment,
  enrollInBatch,
  getBatchAnalytics,
};
