const Company = require('../models/Company');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
const getCompanies = async (req, res) => {
  try {
    const { search, sector, tier } = req.query;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (sector) query.sector = sector;
    if (tier) query.tier = tier;

    const companies = await Company.find(query).sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create company
// @route   POST /api/companies
// @access  Private (placement_cell, super_admin)
const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (placement_cell, super_admin)
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCompanies, getCompanyById, createCompany, updateCompany };
