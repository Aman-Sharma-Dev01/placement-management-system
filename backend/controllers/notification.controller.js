const Notification = require('../models/Notification');
const Student = require('../models/Student');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const query = {
      $or: [
        { userId: req.user._id },
        { targetRole: req.user.role },
        { userId: null, targetRole: null }, // Broadcast to all
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    // Add relative timestamp
    const now = new Date();
    const withTimestamp = notifications.map((n) => {
      const diff = now - new Date(n.createdAt);
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      let timestamp;
      if (mins < 1) timestamp = 'Just now';
      else if (mins < 60) timestamp = `${mins} mins ago`;
      else if (hours < 24) timestamp = `${hours} hours ago`;
      else timestamp = `${days} days ago`;

      return {
        ...n.toObject(),
        timestamp,
      };
    });

    res.json(withTimestamp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications, markAsRead };
