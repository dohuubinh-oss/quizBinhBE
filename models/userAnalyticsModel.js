import mongoose from 'mongoose';

const UserAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // % Điểm trung bình theo từng kỹ năng (0 - 100)
  skillPerformance: {
    grammar: { type: Number, default: 0 },
    vocabulary: { type: Number, default: 0 },
    listening: { type: Number, default: 0 },
    reading: { type: Number, default: 0 },
    writing: { type: Number, default: 0 },
    speaking: { type: Number, default: 0 },
    pronunciation: { type: Number, default: 0 }
  }
});

const UserAnalytics = mongoose.model('UserAnalytics', UserAnalyticsSchema);

export default UserAnalytics;