const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);

module.exports = router;
