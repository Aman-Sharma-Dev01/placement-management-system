const express = require('express');
const router = express.Router();
const { getBlogs, createBlog, updateBlog, deleteBlog } = require('../controllers/blog.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, getBlogs);

router.post(
  '/',
  protect,
  authorize('placement_cell', 'super_admin', 'placement_coordinator'),
  createBlog
);

router.put(
  '/:id',
  protect,
  authorize('placement_cell', 'super_admin', 'placement_coordinator'),
  updateBlog
);

router.delete(
  '/:id',
  protect,
  authorize('placement_cell', 'super_admin', 'placement_coordinator'),
  deleteBlog
);

module.exports = router;
