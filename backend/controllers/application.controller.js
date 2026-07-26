const Application = require('../models/Application');
const PlacementDrive = require('../models/PlacementDrive');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// @desc    Get all applications (filtered by role)
// @route   GET /api/applications
// @access  Private
const getApplications = async (req, res) => {
  try {
    const { driveId, studentId, status } = req.query;
    const query = {};

    // Students can only see their own applications
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        query.studentId = student._id;
      } else {
        return res.json([]);
      }
    }

    if (driveId) query.driveId = driveId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate('driveId')
      .populate('studentId')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply to a drive (student only)
// @route   POST /api/applications
// @access  Private (student)
const applyToDrive = async (req, res) => {
  try {
    const { driveId, selectedResumeId } = req.body;

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const drive = await PlacementDrive.findById(driveId);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    if (drive.status !== 'open') {
      return res.status(400).json({ message: 'This drive is not accepting applications' });
    }

    // Check if already applied
    const existing = await Application.findOne({
      driveId,
      studentId: student._id,
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied to this drive' });
    }

    const application = await Application.create({
      driveId,
      studentId: student._id,
      appliedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      currentStageId: drive.stages[0]?._id?.toString() || '',
      status: 'applied',
      selectedResumeId: selectedResumeId || '',
      stageHistory: [
        {
          stageId: drive.stages[0]?._id?.toString() || 'initial',
          stageName: drive.stages[0]?.name || 'Application Received',
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'pending',
          feedback: 'Application submitted successfully.',
        },
      ],
    });

    // Update drive applied count
    await PlacementDrive.findByIdAndUpdate(driveId, {
      $inc: { totalAppliedCount: 1 },
    });

    // Add drive to student's appliedDriveIds
    await Student.findByIdAndUpdate(student._id, {
      $addToSet: { appliedDriveIds: driveId.toString() },
    });

    // Send notification
    await Notification.create({
      userId: req.user._id,
      title: `Application Submitted: ${drive.companyName}`,
      message: `Your application for ${drive.jobTitle} at ${drive.companyName} was submitted.`,
      type: 'drive',
      linkDriveId: driveId.toString(),
    });

    // Populate before returning
    const populatedApp = await Application.findById(application._id)
      .populate('driveId')
      .populate('studentId');

    res.status(201).json(populatedApp);
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update application stage/status
// @route   PATCH /api/applications/:id/stage
// @access  Private (placement_cell, super_admin)
const updateApplicationStage = async (req, res) => {
  try {
    const { stageId, status, feedback } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const drive = await PlacementDrive.findById(application.driveId);
    const stage = drive?.stages?.find((s) => s._id.toString() === stageId);

    application.currentStageId = stageId || application.currentStageId;
    application.status = status;
    application.stageHistory.push({
      stageId: stageId || application.currentStageId,
      stageName: stage?.name || 'Workflow Stage',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status:
        status === 'shortlisted' || status === 'offered'
          ? 'passed'
          : status === 'rejected'
          ? 'failed'
          : 'pending',
      feedback: feedback || '',
    });

    await application.save();

    // Update drive counts based on status
    if (status === 'shortlisted') {
      await PlacementDrive.findByIdAndUpdate(application.driveId, {
        $inc: { shortlistedCount: 1 },
      });
    } else if (status === 'offered') {
      await PlacementDrive.findByIdAndUpdate(application.driveId, {
        $inc: { selectedCount: 1 },
      });
    }

    // Notify the student
    const student = await Student.findById(application.studentId);
    if (student) {
      await Notification.create({
        userId: student.userId,
        title: `Application Update: ${drive?.companyName || 'Company'}`,
        message: `Your application status has been updated to ${status}.${feedback ? ' Feedback: ' + feedback : ''}`,
        type: status === 'offered' ? 'offer' : 'interview',
        linkDriveId: application.driveId.toString(),
      });
    }

    const populatedApp = await Application.findById(application._id)
      .populate('driveId')
      .populate('studentId');

    res.json(populatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getApplications, applyToDrive, updateApplicationStage };
