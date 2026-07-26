const express = require('express');
const router = express.Router();
const {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
} = require('../controllers/drive.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, getDrives);
router.get('/:id', protect, getDriveById);
router.post('/', protect, authorize('placement_cell', 'super_admin'), createDrive);
router.put('/:id', protect, authorize('placement_cell', 'super_admin'), updateDrive);
router.delete('/:id', protect, authorize('super_admin'), deleteDrive);

module.exports = router;
