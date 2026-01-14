import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';

// @desc    Lấy thông tin cá nhân của người dùng đã đăng nhập
// @route   GET /api/users/me
// @access  Private
const getUserProfile = catchAsync(async (req, res, next) => {
  // Middleware 'protect' đã lấy thông tin user và gán vào req.user
  // Mật khẩu đã được loại bỏ
  res.status(200).json(req.user);
});

// @desc    Lấy tất cả người dùng (cho Admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

export { getUserProfile, getAllUsers };
