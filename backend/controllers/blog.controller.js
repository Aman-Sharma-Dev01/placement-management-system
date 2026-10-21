const Blog = require('../models/Blog');
const PlacementDrive = require('../models/PlacementDrive');
const Student = require('../models/Student');

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Private
const getBlogs = async (req, res) => {
  try {
    const query = {};

    // The announcement of a gender-restricted drive must not reach students
    // of another gender.
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id })
        .select('gender')
        .lean();
      const gender = student?.gender || null;

      const restrictedDrives = await PlacementDrive.find({
        'eligibility.allowedGenders': { $exists: true, $ne: [] },
      })
        .select('_id eligibility.allowedGenders')
        .lean();

      const hiddenDriveIds = restrictedDrives
        .filter((drive) => {
          const allowed = drive.eligibility?.allowedGenders || [];
          if (!allowed.length) return false;
          if (!gender) return true;
          return !allowed.includes(gender);
        })
        .map((drive) => drive._id);

      if (hiddenDriveIds.length) {
        query.relatedDriveId = { $nin: hiddenDriveIds };
      }
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private (placement_cell, super_admin)
const createBlog = async (req, res) => {
  try {
    const { title, content, relatedDriveId, targetAudience, isImportant } = req.body;
    
    const blog = await Blog.create({
      title,
      content,
      authorId: req.user.id,
      authorName: req.user.name,
      relatedDriveId: relatedDriveId || null,
      targetAudience: targetAudience || 'all',
      isImportant: isImportant || false,
    });

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (placement_cell, super_admin)
const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (placement_cell, super_admin)
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBlogs, createBlog, updateBlog, deleteBlog };
