import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Middleware xác thực người dùng đã đăng nhập (bằng token)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header (loại bỏ chữ 'Bearer')
      token = req.headers.authorization.split(' ')[1];

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin người dùng từ ID trong token và gắn vào request
      // Loại bỏ trường password để không bị lộ
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Người dùng không tồn tại.' });
      }

      next(); // Chuyển sang middleware hoặc controller tiếp theo
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Token không hợp lệ, không có quyền truy cập' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Không tìm thấy token, không có quyền truy cập' });
  }
};

// Middleware phân quyền dựa trên vai trò (role)
const authorize = (...roles) => {
  return (req, res, next) => {
    // Middleware này phải chạy SAU middleware 'protect', nên req.user đã có sẵn
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Vai trò của bạn (${req.user.role}) không có quyền truy cập tài nguyên này.`
      });
    }
    next();
  };
};

// Middleware kiểm tra quyền Premium
const checkPremium = (req, res, next) => {
    // Middleware này cũng phải chạy SAU middleware 'protect'
    if (req.user && req.user.subscription.plan === 'PREMIUM') {
        next();
    } else {
        res.status(403).json({ message: 'Tính năng này yêu cầu tài khoản PREMIUM.' });
    }
};

export { protect, authorize, checkPremium };
