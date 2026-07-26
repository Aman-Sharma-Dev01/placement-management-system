const PlacementDrive = require('../models/PlacementDrive');
const Company = require('../models/Company');
const Notification = require('../models/Notification');

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

    // Broadcast notification
    await Notification.create({
      targetRole: 'student',
      title: `New Placement Drive: ${drive.companyName}`,
      message: `${drive.companyName} has opened applications for ${drive.jobTitle} with CTC ${drive.ctcLpa} LPA.`,
      type: 'drive',
      linkDriveId: drive._id.toString(),
    });

    res.status(201).json(drive);
  } catch (error) {
    console.error('Create drive error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update placement drive
// @route   PUT /api/drives/:id
// @access  Private (placement_cell, super_admin)
const updateDrive = async (req, res) => {
  try {
    const drive = await PlacementDrive.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    res.json(drive);
  } catch (error) {
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
