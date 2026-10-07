const PlacementDrive = require('../models/PlacementDrive');
const Company = require('../models/Company');
const Blog = require('../models/Blog');
const eligibilityService = require('../services/eligibilityService');
const notificationService = require('../services/notificationService');

// @desc    Get all placement drives (with filtering)
// @route   GET /api/drives
// @access  Private
const getDrives = async (req, res) => {
  try {
    const { search, sector, positionType, status, sortBy = 'latest' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
      ];
    }
    if (sector) query.sector = sector;
    if (positionType) query.positionType = positionType;
    if (status) query.status = status;

    let sortOption = { createdAt: -1 };
    if (sortBy === 'ctc_high') sortOption = { ctcLpa: -1 };
    else if (sortBy === 'deadline') sortOption = { deadlineDate: 1 };
    else if (sortBy === 'name') sortOption = { companyName: 1 };

    const drives = await PlacementDrive.find(query).sort(sortOption);

    res.json(drives);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single drive by ID
// @route   GET /api/drives/:id
// @access  Private
const getDriveById = async (req, res) => {
  try {
    const drive = await PlacementDrive.findById(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }
    res.json(drive);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new placement drive
// @route   POST /api/drives
// @access  Private (placement_cell, super_admin)
const createDrive = async (req, res) => {
  try {
    const driveData = req.body;

    // Find or create company
    let company = await Company.findOne({
      name: { $regex: new RegExp(`^${driveData.companyName}$`, 'i') },
    });

    if (!company) {
      company = await Company.create({
        name: driveData.companyName,
        logo: driveData.companyLogo || '',
        website: driveData.companyWebsite || '',
        sector: driveData.sector || '',
        tier:
          driveData.ctcLpa > 12
            ? 'Super Dream (>12 LPA)'
            : driveData.ctcLpa >= 6
            ? 'Dream (6-12 LPA)'
            : 'Core',
        mouStatus: 'New Partner',
        activeDrivesCount: 1,
        totalHired: 0,
        avgCtc: driveData.ctcLpa,
        contactPerson: {
          name: 'Campus Relations HR',
          role: 'TA Lead',
          email: `careers@${driveData.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: '+91 00000 00000',
        },
      });
    } else {
      await Company.findByIdAndUpdate(company._id, {
        $inc: { activeDrivesCount: 1 },
      });
    }

    const drive = await PlacementDrive.create({
      ...driveData,
      companyId: company._id,
      totalAppliedCount: 0,
      shortlistedCount: 0,
      selectedCount: 0,
    });

    // Create a blog/announcement for this drive
    await Blog.create({
      title: `New Placement Drive: ${drive.companyName} (${drive.jobTitle})`,
      content: `${drive.companyName} is visiting for the ${drive.jobTitle} role.\nCTC Offered: ${drive.ctcLpa} LPA\nDeadline to apply: ${drive.deadlineDate || 'TBA'}\nCheck the job profile for more details and apply before the deadline.`,
      authorId: req.user.id,
      authorName: req.user.name || 'Placement Cell',
      relatedDriveId: drive._id,
      targetAudience: 'students',
      isImportant: true,
    });

    res.status(201).json(drive);

    // Notifications run after the response. Previously this was a blanket
    // `targetRole: 'student'` broadcast, which emailed every student on the
    // campus including those the drive is not open to. It is now targeted at
    // students the eligibility rules actually match.
    (async () => {
      try {
        const eligible = await eligibilityService.findEligibleStudents(drive);
        const byStudentId = Object.fromEntries(
          eligible.map((student) => [student._id.toString(), eligibilityService.evaluate(student, drive)])
        );

        await Promise.all([
          eligibilityService.refreshEligibleCount(drive),
          notificationService.newJobForEligible({
            drive,
            students: eligible,
            eligibilityByStudent: byStudentId,
          }),
        ]);

        console.log(
          `[drive] ${drive.companyName} — notified ${eligible.length} eligible student(s)`
        );
      } catch (error) {
        console.error('Drive publish notification failed:', error.message);
      }
    })();
  } catch (error) {
    console.error('Create drive error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fields whose change a student genuinely needs to hear about. Anything not
 * listed here (logos, third-party links, counters) is silent, otherwise
 * every save would spam applicants.
 */
const MATERIAL_FIELDS = [
  { path: 'deadlineDate', label: 'Deadline' },
  { path: 'ctcLpa', label: 'CTC' },
  { path: 'stipendMonthly', label: 'Stipend' },
  { path: 'jobTitle', label: 'Role' },
  { path: 'positionType', label: 'Position type' },
  { path: 'location', label: 'Location' },
  { path: 'workMode', label: 'Work mode' },
  { path: 'status', label: 'Status' },
];

const ELIGIBILITY_LABELS = {
  minCgpa: 'Minimum CGPA',
  minTenthPercentage: 'Minimum 10th %',
  minTwelfthPercentage: 'Minimum 12th %',
  maxActiveBacklogs: 'Max active backlogs',
  maxHistoryBacklogs: 'Max history backlogs',
  maxGapYears: 'Max gap years',
  allowedBatchYears: 'Allowed batches',
};

const sameValue = (a, b) => String(a ?? '') === String(b ?? '');

// @desc    Update placement drive
// @route   PUT /api/drives/:id
// @access  Private (placement_cell, super_admin)
const updateDrive = async (req, res) => {
  try {
    // Snapshot before the write so we can describe exactly what changed.
    const before = await PlacementDrive.findById(req.params.id).lean();
    if (!before) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    const drive = await PlacementDrive.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    res.json(drive);

    // --- Post-response notifications -----------------------------------
    (async () => {
      try {
        const changes = [];

        MATERIAL_FIELDS.forEach(({ path, label }) => {
          if (req.body[path] === undefined) return;
          if (!sameValue(before[path], drive[path])) {
            changes.push({ label, before: before[path], after: drive[path] });
          }
        });

        // Eligibility rule edits matter as much as the headline fields.
        if (req.body.eligibility) {
          Object.entries(ELIGIBILITY_LABELS).forEach(([key, label]) => {
            const from = before.eligibility?.[key];
            const to = drive.eligibility?.[key];
            if (req.body.eligibility[key] !== undefined && !sameValue(from, to)) {
              changes.push({ label, before: from, after: to });
            }
          });
        }

        const isNowClosed = drive.status === 'closed';

        if (isNowClosed) {
          const [applicants, eligibleStudents] = await Promise.all([
            eligibilityService.findApplicants(drive),
            eligibilityService.findEligibleStudents(drive),
          ]);

          // The schema has no 'cancelled' status, so a move to 'closed' is
          // reported as a closure rather than inventing a cancellation.
          await notificationService.driveClosed({
            drive,
            reason: 'The placement cell has closed applications for this drive.',
            wasCancelled: false,
            applicants,
            eligibleStudents,
          });
          return;
        }

        if (!changes.length) return;

        // Applicants are told about anything material. Students who were *not*
        // eligible before but are now are told as well — that is the whole
        // point of relaxing a rule.
        const [applicants, allEligible] = await Promise.all([
          eligibilityService.findApplicants(drive),
          eligibilityService.findEligibleStudents(drive),
        ]);

        const applicantIds = new Set(applicants.map((s) => s._id.toString()));
        const newlyEligible = allEligible.filter(
          (student) =>
            !applicantIds.has(student._id.toString()) &&
            // Was this student excluded by the *old* rules?
            !eligibilityService.evaluate(student, before).eligible
        );

        await notificationService.driveUpdated({ drive, changes, applicants, newlyEligible });

        // Eligibility edits can change the headline count.
        if (req.body.eligibility) {
          await eligibilityService.refreshEligibleCount(drive);
        }

        console.log(
          `[drive] ${drive.companyName} updated (${changes.length} material change(s)) — notified ${applicants.length} applicant(s), ${newlyEligible.length} newly eligible`
        );
      } catch (error) {
        console.error('Drive update notification failed:', error.message);
      }
    })();
  } catch (error) {
    console.error('Update drive error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete placement drive
// @route   DELETE /api/drives/:id
// @access  Private (super_admin)
const deleteDrive = async (req, res) => {
  try {
    const drive = await PlacementDrive.findByIdAndDelete(req.params.id);
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    // Decrement company active drives count
    await Company.findByIdAndUpdate(drive.companyId, {
      $inc: { activeDrivesCount: -1 },
    });

    res.json({ message: 'Drive deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDrives, getDriveById, createDrive, updateDrive, deleteDrive };
