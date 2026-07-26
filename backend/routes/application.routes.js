const express = require('express');
const router = express.Router();
const {
  getApplications,
  applyToDrive,
  updateApplicationStage,
} = require('../controllers/application.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, getApplications);
router.post('/', protect, authorize('student'), applyToDrive);
router.patch(
  '/:id/stage',
  protect,
  authorize('placement_cell', 'super_admin'),
  updateApplicationStage
);

module.exports = router;
