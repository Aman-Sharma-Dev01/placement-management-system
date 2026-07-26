// @desc    Upload file to Cloudinary
// @route   POST /api/upload/resume | /marksheet | /avatar | /logo
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadFile };
