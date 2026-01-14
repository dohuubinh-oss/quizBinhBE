import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Middleware xác thực người dùng đã đăng nhập (bằng token)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header (loại bỏ chữ 'Bearer')
      token = req.headers.authorization.split(' ')[1];

      // Kiểm tra xem token có tồn tại sau khi tách chuỗi không
      if (!token || token === 'undefined') {
        return res.status(401).json({ message: 'Xác thực thất bại, token không được cung cấp.' });
      }

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin người dùng từ ID trong token và gắn vào request
      // Loại bỏ trường password để không bị lộ
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Người dùng không tồn tại.' });
      }

      next();
    } catch (error) {
      // Bắt các lỗi từ jwt.verify (token sai định dạng, hết hạn, etc.)
      console.error('Lỗi xác thực Token:', error.message);
      return res.status(401).json({ message: 'Xác thực thất bại, token không hợp lệ.' });
    }
  } else {
    // Nếu không có header 'Authorization' hoặc không bắt đầu bằng 'Bearer'
    return res.status(401).json({ message: 'Xác thực thất bại, không tìm thấy token.' });
  }
};

// Middleware kiểm tra quyền hạn (ví dụ: 'ADMIN')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // Sửa lỗi: Trả về mã lỗi 403 Forbidden thay vì 401
      return res.status(403).json({ message: `Người dùng với vai trò '${req.user.role}' không có quyền truy cập vào tài nguyên này.` });
    }
    next();
  };
};

export { protect, authorize };
