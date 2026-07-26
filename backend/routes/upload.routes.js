const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');
const { uploadResume, uploadMarksheet, uploadAvatar, uploadLogo } = require('../middleware/upload');

router.post('/resume', protect, uploadResume.single('file'), uploadFile);
router.post('/marksheet', protect, uploadMarksheet.single('file'), uploadFile);
router.post('/avatar', protect, uploadAvatar.single('file'), uploadFile);
router.post('/logo', protect, uploadLogo.single('file'), uploadFile);

module.exports = router;
