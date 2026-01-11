import express from 'express';
const router = express.Router();

import { upgradeToPremium } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// Route để nâng cấp tài khoản người dùng
// Chỉ ADMIN mới có quyền thực hiện hành động này
router.route('/upgrade').post(protect, authorize('ADMIN'), upgradeToPremium);

export default router;
