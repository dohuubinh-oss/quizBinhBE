import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  // 1. Phân loại chung
  category: { type: String, enum: ['TOEIC', 'ACADEMIC', 'PLACEMENT'], required: true },
  part: { type: Number, required: true }, // TOEIC (1-7), Academic (tương ứng Ex 1-12)
  
  // 2. Định dạng câu hỏi (Quyết định cách hiển thị UI)
  format: { 
    type: String, 
    enum: ['MULTIPLE_CHOICE', 'FILL_IN', 'TRANSFORM', 'WRITING'], 
    required: true 
  },

  // 3. Tài nguyên đi kèm (Media)
  resource: {
    audioUrl: String,   // Part 1, 2, 3, 4 TOEIC
    imageUrl: String,   // Part 1 TOEIC, Ex 12 Academic
    passages: [String], // Đoạn văn: Part 6, 7 TOEIC hoặc Ex 9, 10, 11 Academic
  },

  // 4. Danh sách câu hỏi (Xử lý được cả câu đơn và câu chùm)
  subQuestions: [{
    questionNumber: Number,
    content: String,          // Đề bài (Ví dụ: "Does she fancy...")
    subText: String,          // Gợi ý cho câu viết lại (Ví dụ: "Mr. Brown...")
    options: [String],        // Mảng 4 đáp án cho trắc nghiệm
    correctAnswer: [String],  // Mảng đáp án (Dùng mảng để chứa nhiều cách viết đúng)
    explanation: String,      // Giải thích đáp án
    tags: [String]            // ["Grammar", "Tense", "Vocab"]
  }],

  // 5. Thông tin quản lý
  metadata: {
    level: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' } // Tham chiếu đến một model Exam trong tương lai
  }
}, { timestamps: true });

const Question = mongoose.model('Question', QuestionSchema);

export default Question;
