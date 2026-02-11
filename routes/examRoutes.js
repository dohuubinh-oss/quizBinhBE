import express from 'express';
import multer from 'multer';
import {
  getAllExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  importExamFromWord,
  gradeExam
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router
  .route('/import-word')
  .post(
    protect, 
    authorize('ADMIN', 'TEACHER'), 
    upload.single('examFile'), 
    importExamFromWord
  );

router
  .route('/')
  .get(protect, getAllExams)
  .post(protect, authorize('ADMIN', 'TEACHER'), createExam);

router
  .route('/:id')
  .get(protect, getExam)
  .patch(protect, authorize('ADMIN', 'TEACHER'), updateExam)
  .delete(protect, authorize('ADMIN', 'TEACHER'), deleteExam);

router
    .route('/:id/grade')
    .post(protect, gradeExam)

export default router;
