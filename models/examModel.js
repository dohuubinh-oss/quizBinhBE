import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['TOEIC', 'ACADEMIC'], required: true },
  duration: { type: Number, required: true }, // Thời gian làm bài (phút)

  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  
  sections: [{
    sectionName: String,
    description: String,
    questionList: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Question' 
    }]
  }],

  metadata: {
    totalPoints: Number,
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    isPublished: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false } // Nếu false, chỉ PREMIUM user trở lên mới xem được
  }
}, { timestamps: true });

const Exam = mongoose.model('Exam', ExamSchema);

export default Exam;
