import User from '../models/userModel.js';

// @desc    Nâng cấp tài khoản người dùng lên PREMIUM
// @route   POST /api/payments/upgrade
// @access  Private/Admin (trong ví dụ này, chỉ Admin có thể nâng cấp cho người dùng)
const upgradeToPremium = async (req, res) => {
  // Khi tích hợp thật, thông tin này sẽ đến từ webhook của cổng thanh toán
  // hoặc từ form của Admin.
  const { userId, durationInMonths } = req.body; // Cần userId và thời hạn của gói

  if (!userId || !durationInMonths) {
    return res.status(400).json({ message: 'Vui lòng cung cấp ID người dùng và thời hạn gói.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
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

  } catch (error) {
    console.error('Lỗi khi nâng cấp tài khoản:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi xử lý yêu cầu.' });
  }
};

export { upgradeToPremium };
