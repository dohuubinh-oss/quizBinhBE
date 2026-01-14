import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// @desc    Nâng cấp tài khoản người dùng lên PREMIUM
// @route   POST /api/payments/upgrade
// @access  Private/Admin (trong ví dụ này, chỉ Admin có thể nâng cấp cho người dùng)
const upgradeToPremium = catchAsync(async (req, res, next) => {
  // Khi tích hợp thật, thông tin này sẽ đến từ webhook của cổng thanh toán
  // hoặc từ form của Admin.
  const { userId, durationInMonths } = req.body; // Cần userId và thời hạn của gói

  if (!userId || !durationInMonths) {
    return next(new AppError('Vui lòng cung cấp ID người dùng và thời hạn gói.', 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError('Không tìm thấy người dùng.', 404));
  }

  const now = new Date();
  
  // Tính ngày hết hạn mới
  // Nếu người dùng đang là PREMIUM và còn hạn, ta sẽ cộng dồn thời gian
  const startDate = (user.subscription.plan === 'PREMIUM' && user.subscription.endDate > now) 
                      ? user.subscription.endDate 
                      : now;
                      
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + parseInt(durationInMonths, 10));

  // Cập nhật thông tin gói cước
  user.subscription.plan = 'PREMIUM';
  user.subscription.isActive = true;
  user.subscription.startDate = user.subscription.startDate || now; // Chỉ đặt nếu chưa có
  user.subscription.endDate = endDate;
  user.subscription.paymentDetails.lastPaymentDate = now;

  const updatedUser = await user.save();

  res.status(200).json({
    message: `Đã nâng cấp tài khoản cho ${user.email} thành công.`,
    subscription: updatedUser.subscription
  });
});

export { upgradeToPremium };
