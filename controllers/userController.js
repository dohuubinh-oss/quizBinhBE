import User from '../models/userModel.js';

// @desc    Lấy thông tin cá nhân của người dùng đã đăng nhập
// @route   GET /api/users/me
// @access  Private
const getUserProfile = async (req, res) => {
  // Middleware 'protect' đã lấy thông tin user và gán vào req.user
  // Mật khẩu đã được loại bỏ
  res.status(200).json(req.user);
};

// @desc    Lấy tất cả người dùng (cho Admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

export { getUserProfile, getAllUsers };
