const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

// Declared before '/:id/read' so "read-all" is not swallowed by the :id route.
router.get('/unread-count', protect, getUnreadCount);
router.patch('/read-all', protect, markAllAsRead);

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);

module.exports = router;
