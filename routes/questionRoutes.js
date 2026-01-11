import express from 'express';
import { bulkImportQuestions } from '../controllers/questionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/questions/import
router.route('/import').post(protect, admin, bulkImportQuestions);

export default router;
