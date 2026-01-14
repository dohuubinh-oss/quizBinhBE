import jwt from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/userModel.js';

// Middleware này cố gắng xác thực người dùng nếu có token,
// nhưng không bắt buộc. Nếu không có token, nó sẽ bỏ qua mà không báo lỗi.
const softProtect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin người dùng từ ID trong token (không lấy password)
      req.user = await User.findById(decoded.id).select('-password');
      
    } catch (error) {
      // Nếu token không hợp lệ, không cần làm gì, req.user sẽ là undefined
      console.error('Token không hợp lệ hoặc đã hết hạn, nhưng vẫn cho phép truy cập với quyền khách.');
    }
  }

  // Dù có token hay không, vẫn tiếp tục tới middleware/controller tiếp theo
  next();
});

export { softProtect };
