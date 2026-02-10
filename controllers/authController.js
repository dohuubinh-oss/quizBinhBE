import User from '../models/userModel.js';
import UserAnalytics from '../models/userAnalyticsModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      plan: user.subscription.plan 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

const registerUser = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return next(new AppError('Người dùng đã tồn tại', 400));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  if (user) {
    // KHỞI TẠO BẢNG ANALYTICS
    const analytics = new UserAnalytics({ userId: user._id });
    await analytics.save();

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      plan: user.subscription.plan,
      token: generateToken(user),
    });
  } else {
    return next(new AppError('Dữ liệu người dùng không hợp lệ', 400));
  }
});

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Thông tin đăng nhập không chính xác', 401));
  }

  // Check Premium Expiry
  if (user.subscription.plan === 'PREMIUM' && user.subscription.endDate && user.subscription.endDate < new Date()) {
    user.subscription.plan = 'FREE';
    user.subscription.isActive = false;
    await user.save();
  }

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    plan: user.subscription.plan,
    token: generateToken(user),
  });
});

const logoutUser = (req, res) => {
  res.status(200).json({ message: 'Đăng xuất thành công' });
};

// Xử lý callback sau khi đăng nhập qua MXH thành công
const socialLoginCallback = (req, res) => {
  // Passport đã xác thực và gắn user vào req.user
  const token = generateToken(req.user);

  // Chuyển hướng người dùng về trang frontend với token
  // Ví dụ: http://your-frontend.com/auth/callback?token=...
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000'; 

  res.redirect(`${clientUrl}/auth/social-callback?token=${token}`);
};

export { registerUser, loginUser, logoutUser, socialLoginCallback };
