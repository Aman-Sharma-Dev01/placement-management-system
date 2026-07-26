const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  getMyProfile,
  updateStudent,
  verifyStudent,
  bulkVerifyStudents,
} = require('../controllers/student.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Student's own profile — must be before /:id to avoid conflict
router.get('/me', protect, getMyProfile);

// Bulk verify — must be before /:id
router.patch(
  '/bulk-verify',
  protect,
  authorize('placement_coordinator', 'super_admin'),
  bulkVerifyStudents
);

// List all students
router.get(
  '/',
  protect,
  authorize('placement_coordinator', 'placement_cell', 'super_admin'),
  getStudents
);

// Get single student
router.get('/:id', protect, getStudentById);

// Update student
router.put('/:id', protect, updateStudent);

// Verify student
router.patch(
  '/:id/verify',
  protect,
  authorize('placement_coordinator', 'super_admin'),
  verifyStudent
);

module.exports = router;
