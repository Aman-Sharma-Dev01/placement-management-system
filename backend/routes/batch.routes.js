const express = require('express');
const router = express.Router();
const {
  getBatches,
  createBatch,
  updateBatch,
  toggleEnrollment,
  enrollInBatch,
  getBatchAnalytics,
} = require('../controllers/batch.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Get all batches (all authenticated users — students need this to enroll)
router.get('/', protect, getBatches);

// Create batch — placement cell & super admin
router.post('/', protect, authorize('placement_cell', 'super_admin'), createBatch);

// Update batch details
router.put('/:id', protect, authorize('placement_cell', 'super_admin'), updateBatch);

// Toggle enrollment open/close
router.patch('/:id/toggle-enrollment', protect, authorize('placement_cell', 'super_admin'), toggleEnrollment);

// Student enroll
router.post('/:id/enroll', protect, authorize('student'), enrollInBatch);

// Analytics for a batch
router.get(
  '/:id/analytics',
  protect,
  authorize('placement_cell', 'placement_coordinator', 'super_admin'),
  getBatchAnalytics
);

module.exports = router;
