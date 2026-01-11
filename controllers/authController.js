import User from '../models/userModel.js';
import UserAnalytics from '../models/userAnalyticsModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Người dùng đã tồn tại' });
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
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
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
    } else {
      res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

export { registerUser, loginUser };
