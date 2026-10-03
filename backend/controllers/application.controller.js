const Application = require('../models/Application');
const PlacementDrive = require('../models/PlacementDrive');
const Student = require('../models/Student');
const eligibilityService = require('../services/eligibilityService');
const notificationService = require('../services/notificationService');

// Matches the existing timestamp format used across stageHistory/appliedAt.
const nowStamp = () => new Date().toISOString().replace('T', ' ').substring(0, 16);

const resolveResumeName = (student, selectedResumeId) => {
  if (!selectedResumeId) return '';
  const resume = (student.resumes || []).find(
    (item) => String(item._id) === String(selectedResumeId)
  );
  return resume?.name || '';
};

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
      if (!student) {
        return res.json([]);
      }
      query.studentId = student._id;
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
    console.error('Get applications error:', error);
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

    // The drive's eligibility rules were previously stored but never checked,
    // so any student could apply to any open drive. Now that the evaluator
    // exists, it is enforced at the point of submission.
    const { eligible, reasons } = eligibilityService.evaluate(student, drive);
    if (!eligible) {
      return res.status(403).json({
        message: 'You are not eligible for this drive',
        reasons,
      });
    }

    const application = await Application.create({
      driveId,
      studentId: student._id,
      appliedAt: nowStamp(),
      currentStageId: drive.stages[0]?._id?.toString() || '',
      status: 'applied',
      selectedResumeId: selectedResumeId || '',
      stageHistory: [
        {
          stageId: drive.stages[0]?._id?.toString() || 'initial',
          stageName: drive.stages[0]?.name || 'Application Received',
          updatedAt: nowStamp(),
          status: 'pending',
          feedback: 'Application submitted successfully.',
          feedbackVisibleToStudent: true,
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

    // Populate before returning
    const populatedApp = await Application.findById(application._id)
      .populate('driveId')
      .populate('studentId');

    res.status(201).json(populatedApp);

    // Confirmation notification after the response.
    notificationService
      .applicationSubmitted({
        application,
        student,
        drive,
        resumeName: resolveResumeName(student, selectedResumeId),
      })
      .catch((error) => console.error('Application notification failed:', error.message));
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
    const { stageId, status, feedback, feedbackVisibleToStudent } = req.body;

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const drive = await PlacementDrive.findById(application.driveId);
    const stage = drive?.stages?.find((s) => s._id.toString() === stageId);

    const previousStage = drive?.stages?.find(
      (s) => s._id.toString() === application.currentStageId
    );
    const previousScheduled = previousStage?.scheduledDate || '';
    const nextScheduled = stage?.scheduledDate || '';
    const stageChanged = Boolean(stageId) && stageId !== application.currentStageId;
    const rescheduled = stageChanged && previousScheduled && nextScheduled &&
      previousScheduled !== nextScheduled;
    const cancelled = stageChanged && stage?.isCompleted === false && !nextScheduled;
    // Captured before the write so count increments happen only on a real
    // transition, never on a re-save of the same status.
    const previousApplicationStatus = application.status;
    const newStatus = status || application.status;

    application.currentStageId = stageId || application.currentStageId;
    application.status = newStatus;
    application.stageHistory.push({
      stageId: stageId || application.currentStageId,
      stageName: stage?.name || 'Workflow Stage',
      updatedAt: nowStamp(),
      status:
        newStatus === 'shortlisted' || newStatus === 'offered'
          ? 'passed'
          : newStatus === 'rejected'
          ? 'failed'
          : 'pending',
      feedback: feedback || '',
      // Coordinator feedback is confidential unless explicitly shared.
      feedbackVisibleToStudent: Boolean(feedbackVisibleToStudent),
    });

    await application.save();

    // Update drive counts based on status.
    //
    // These counters are milestone totals ("how many applications reached this
    // stage"), so they may only ever be incremented while a student moves
    // *forward* through the pipeline. Comparing `previous !== target` alone
    // would also count demotions — flipping offered -> shortlisted would inflate
    // `shortlistedCount` and hide the fact that the student already had an
    // offer.
    const STATUS_PROGRESS = { pending: 0, rejected: 0, withdrawn: 0, shortlisted: 1, offered: 2 };
    const previousRank = STATUS_PROGRESS[previousApplicationStatus] ?? 0;

    const advancedTo = (to) => {
      const targetRank = STATUS_PROGRESS[to] ?? 0;
      return targetRank > previousRank;
    };

    if (advancedTo('shortlisted')) {
      await PlacementDrive.findByIdAndUpdate(application.driveId, { $inc: { shortlistedCount: 1 } });
    } else if (advancedTo('offered')) {
      await PlacementDrive.findByIdAndUpdate(application.driveId, { $inc: { selectedCount: 1 } });
    }

    const populatedApp = await Application.findById(application._id)
      .populate('driveId')
      .populate('studentId');

    res.json(populatedApp);

    // --- Post-response notifications -----------------------------------
    const student = await Student.findById(application.studentId);
    if (!student || !drive) return;

    const run = async () => {
      if (rescheduled) {
        await notificationService.interviewEvent({
          application, student, drive, stage, kind: 'rescheduled', previous: previousScheduled,
        });
        return;
      }
      if (cancelled) {
        await notificationService.interviewEvent({
          application, student, drive, stage, kind: 'cancelled',
          reason: feedback || 'The placement cell cancelled this round.',
        });
        return;
      }
      if (stageChanged && nextScheduled) {
        await notificationService.interviewEvent({
          application, student, drive, stage, kind: 'scheduled',
        });
        return;
      }
      await notificationService.applicationStageChanged({
        application, student, drive, stage, status: newStatus,
        feedback: feedback || '',
        feedbackVisibleToStudent: Boolean(feedbackVisibleToStudent),
      });
    };

    run().catch((error) => console.error('Stage notification failed:', error.message));
  } catch (error) {
    console.error('Update application stage error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw an application (student only)
// @route   PATCH /api/applications/:id/withdraw
// @access  Private (student, owner)
const withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student || application.studentId.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'You can only withdraw your own application' });
    }

    if (application.status === 'withdrawn') {
      return res.status(400).json({ message: 'This application is already withdrawn' });
    }
    if (application.status === 'offered') {
      return res.status(400).json({
        message: 'You cannot withdraw after receiving an offer. Contact the placement cell.',
      });
    }

    application.status = 'withdrawn';
    application.stageHistory.push({
      stageId: application.currentStageId || 'withdrawn',
      stageName: 'Withdrawn by Student',
      updatedAt: nowStamp(),
      status: 'failed',
      feedback: 'You withdrew this application.',
      feedbackVisibleToStudent: true,
    });
    await application.save();

    await Promise.all([
      PlacementDrive.findByIdAndUpdate(application.driveId, { $inc: { totalAppliedCount: -1 } }),
      Student.findByIdAndUpdate(student._id, { $pull: { appliedDriveIds: application.driveId.toString() } }),
    ]);

    res.json(application);
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getApplications,
  applyToDrive,
  updateApplicationStage,
  withdrawApplication,
};
