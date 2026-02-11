import express from 'express';
import {
  getAllQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
  generateQuestion // Import the new generator function
} from '../controllers/questionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- NEW AI-POWERED ROUTE ---
// This route should come before routes with parameters like /:id
router
  .route('/generate')
  .post(protect, authorize('ADMIN', 'TEACHER'), generateQuestion);

// Route for bulk importing questions
router
  .route('/import')
  .post(protect, authorize('ADMIN', 'TEACHER'), bulkImportQuestions);

// Routes for getting all questions and creating a new one (manually)
router
  .route('/')
  .get(protect, authorize('ADMIN', 'TEACHER'), getAllQuestions)
  .post(protect, authorize('ADMIN', 'TEACHER'), createQuestion);

// Routes for getting, updating, and deleting a single question by ID
router
  .route('/:id')
  .get(protect, authorize('ADMIN', 'TEACHER'), getQuestion)
  .patch(protect, authorize('ADMIN', 'TEACHER'), updateQuestion)
  .delete(protect, authorize('ADMIN', 'TEACHER'), deleteQuestion);

export default router;
