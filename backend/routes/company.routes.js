const express = require('express');
const router = express.Router();
const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
} = require('../controllers/company.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, getCompanies);
router.get('/:id', protect, getCompanyById);
router.post('/', protect, authorize('placement_cell', 'super_admin'), createCompany);
router.put('/:id', protect, authorize('placement_cell', 'super_admin'), updateCompany);

module.exports = router;
