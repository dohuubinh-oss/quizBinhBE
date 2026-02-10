import express from 'express';
import {
  getAllQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions
} from '../controllers/questionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for getting all questions and creating a new one
router
  .route('/')
  .get(protect, authorize('ADMIN'), getAllQuestions)
  .post(protect, authorize('ADMIN'), createQuestion);

// Routes for getting, updating, and deleting a single question by ID
router
  .route('/:id')
  .get(protect, authorize('ADMIN'), getQuestion)
  .patch(protect, authorize('ADMIN'), updateQuestion)
  .delete(protect, authorize('ADMIN'), deleteQuestion);

// Route for bulk importing questions
router
  .route('/import')
  .post(protect, authorize('ADMIN'), bulkImportQuestions);

export default router;
