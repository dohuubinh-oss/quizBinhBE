import express from 'express';
import { getAllQuestions, bulkImportQuestions } from '../controllers/questionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('ADMIN'), getAllQuestions);

router
  .route('/import')
  .post(protect, authorize('ADMIN'), bulkImportQuestions);

export default router;
