
import express from 'express';
import passport from 'passport';
import {
  registerUser,
  loginUser,
  logoutUser,
  socialLoginCallback
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Local Auth ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);

// --- Google Auth ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }), // Chuyển hướng về trang login nếu thất bại
  socialLoginCallback // Xử lý sau khi thành công
);

// --- Facebook Auth ---
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  socialLoginCallback
);

export default router;
