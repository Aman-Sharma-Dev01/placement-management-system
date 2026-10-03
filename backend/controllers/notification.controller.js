const Notification = require('../models/Notification');

/**
 * Notification feed.
 *
 * Every query here is scoped to the authenticated user. Notifications are
 * personal: another student's shortlisted result or a coordinator's internal
 * note must never be readable by guessing an ObjectId.
 */

/** Notifications visible to a user: their own, their role's, and broadcasts. */
const visibleToUser = (user) => ({
  $or: [
    { userId: user._id },
    { targetRole: user.role },
    { userId: null, targetRole: null },
  ],
});

const withRelativeTimestamp = (notification) => {
  const diff = Date.now() - new Date(notification.createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  let timestamp;
  if (mins < 1) timestamp = 'Just now';
  else if (mins < 60) timestamp = `${mins} mins ago`;
  else if (hours < 24) timestamp = `${hours} hours ago`;
  else timestamp = `${days} days ago`;

  return { ...notification.toObject(), timestamp };
};

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const unreadOnly = req.query.unreadOnly === 'true';

    const query = visibleToUser(req.user);
    if (unreadOnly) query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      ...visibleToUser(req.user),
      read: false,
    });

    res.json({
      notifications: notifications.map(withRelativeTimestamp),
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    // The visibility predicate is part of the update, not a pre-check: this
    // closes the previous IDOR where any id could be marked read.
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, ...visibleToUser(req.user) },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    ).catch((error) => {
      // An invalid ObjectId is a 404 here, not a 500.
      if (error.name === 'CastError') return null;
      throw error;
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark every visible notification as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { ...visibleToUser(req.user), read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ updated: result.modifiedCount || 0 });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unread count only, for the bell badge
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      ...visibleToUser(req.user),
      read: false,
    });
    res.json({ unreadCount });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, getUnreadCount };
