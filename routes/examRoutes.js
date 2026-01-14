import express from 'express';
import { getAllExams } from '../controllers/examController.js';

const router = express.Router();

router.route('/').get(getAllExams);

export default router;
