import express from 'express';
import {
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getAllBlogs)
  .post(protect, createBlog); // Assuming 'protect' is your authentication middleware

router
  .route('/:slug')
  .get(getBlog);

router
  .route('/:id')
  .patch(protect, updateBlog)
  .delete(protect, deleteBlog);

export default router;
