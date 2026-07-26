const Student = require('../models/Student');
const PlacementDrive = require('../models/PlacementDrive');
const Application = require('../models/Application');
const Company = require('../models/Company');

// @desc    Get aggregated dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const verifiedStudents = await Student.countDocuments({ verificationStatus: 'verified' });
    const pendingStudents = await Student.countDocuments({ verificationStatus: 'pending' });

    const totalDrives = await PlacementDrive.countDocuments();
    const openDrives = await PlacementDrive.countDocuments({ status: 'open' });
    const closedDrives = await PlacementDrive.countDocuments({ status: 'closed' });

    const totalApplications = await Application.countDocuments();
    const offeredCount = await Application.countDocuments({ status: 'offered' });
    const rejectedCount = await Application.countDocuments({ status: 'rejected' });

    const totalCompanies = await Company.countDocuments();

    // CTC statistics
    const ctcStats = await PlacementDrive.aggregate([
      { $match: { status: { $in: ['open', 'closed'] } } },
      {
        $group: {
          _id: null,
          avgCtc: { $avg: '$ctcLpa' },
          maxCtc: { $max: '$ctcLpa' },
          minCtc: { $min: '$ctcLpa' },
        },
      },
    ]);

    // Placement rate
    const placedStudents = await Application.distinct('studentId', { status: 'offered' });
    const placementRate = totalStudents > 0 ? ((placedStudents.length / totalStudents) * 100).toFixed(1) : 0;

    // Drives by sector
    const drivesBySector = await PlacementDrive.aggregate([
      { $group: { _id: '$sector', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Applications by status
    const applicationsByStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Recent drives
    const recentDrives = await PlacementDrive.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('companyName jobTitle ctcLpa status positionType companyLogo deadlineDate');

    // If role is student, include student-specific stats
    let studentStats = null;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        const myApplications = await Application.find({ studentId: student._id });
        const myOffers = myApplications.filter((a) => a.status === 'offered').length;
        studentStats = {
          totalApplied: myApplications.length,
          underReview: myApplications.filter((a) => a.status === 'under_review').length,
          shortlisted: myApplications.filter((a) => a.status === 'shortlisted').length,
          offered: myOffers,
          rejected: myApplications.filter((a) => a.status === 'rejected').length,
          profileCompletion: student.profileCompletionPercentage,
          verificationStatus: student.verificationStatus,
        };
      }
    }

    res.json({
      totalStudents,
      verifiedStudents,
      pendingStudents,
      totalDrives,
      openDrives,
      closedDrives,
      totalApplications,
      offeredCount,
      rejectedCount,
      totalCompanies,
      ctcStats: ctcStats[0] || { avgCtc: 0, maxCtc: 0, minCtc: 0 },
      placementRate,
      drivesBySector,
      applicationsByStatus,
      recentDrives,
      studentStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
