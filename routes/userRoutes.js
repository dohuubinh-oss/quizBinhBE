import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getUserProfile, getAllUsers } from '../controllers/userController.js';

// Route để người dùng lấy thông tin cá nhân của họ
// Chỉ cần middleware 'protect' để đảm bảo họ đã đăng nhập
router.route('/me').get(protect, getUserProfile);

// Route để Admin lấy danh sách tất cả người dùng
// Cần cả 'protect' và 'authorize'
router.route('/').get(protect, authorize('ADMIN'), getAllUsers);

export default router;
