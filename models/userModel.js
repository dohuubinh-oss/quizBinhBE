import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // --- THÔNG TIN CƠ BẢN ---
  username: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: false // Không bắt buộc đối với đăng nhập bằng MXH
  },
  googleId: {
    type: String
  },
  facebookId: {
    type: String
  },
  avatar: { 
    type: String, 
    default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' 
  },

  // --- PHÂN QUYỀN (Roles) ---
  role: { 
    type: String, 
    enum: ['STUDENT', 'TEACHER', 'ADMIN'], 
    default: 'STUDENT' 
  },

  // --- QUẢN LÝ GÓI TRẢ PHÍ (Subscription) ---
  subscription: {
    plan: { 
      type: String, 
      enum: ['FREE', 'PREMIUM'], 
      default: 'FREE' 
    },
    startDate: { 
      type: Date, 
      default: null 
    },
    endDate: { 
      type: Date, 
      default: null // Khi thời gian hiện tại > endDate => Trở về gói FREE
    },
    isActive: { 
      type: Boolean, 
      default: false 
    }
  },

  // --- THỐNG KÊ TỔNG QUÁT ---
  // Giúp hiển thị nhanh trên Dashboard mà không cần tính toán lại từ bảng Analytics
  overallStats: {
    totalExamsTaken: { 
      type: Number, 
      default: 0 
    },
    averageScore: { 
      type: Number, 
      default: 0 
    },
    lastActive: { 
      type: Date, 
      default: Date.now 
    }
  }
}, { 
  timestamps: true // Tự động tạo createdAt và updatedAt
});

// Middleware (Hậu xử lý): Trước khi trả về dữ liệu cho Client, 
// có thể check nhanh xem subscription còn hạn không
UserSchema.methods.checkSubscriptionStatus = function() {
  if (this.subscription.endDate && this.subscription.endDate < new Date()) {
    return false; // Đã hết hạn
  }
  return this.subscription.isActive;
};

const User = mongoose.model('User', UserSchema);

export default User;