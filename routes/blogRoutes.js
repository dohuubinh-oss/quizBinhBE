import express from 'express';
import {
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blogController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getAllBlogs)
  .post(protect, authorize('ADMIN', 'TEACHER'), createBlog);

router
  .route('/:slug')
  .get(getBlog);

router
  .route('/:id')
  .patch(protect, authorize('ADMIN', 'TEACHER'), updateBlog)
  .delete(protect, authorize('ADMIN', 'TEACHER'), deleteBlog);

export default router;
