import Exam from '../models/examModel.js';
import Question from '../models/questionModel.js'; // Import Question model
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';
import mammoth from 'mammoth'; // Import mammoth
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Google AI

// --- Các hàm CRUD hiện có ---

// @desc    Get all exams
export const getAllExams = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Exam.find(), req.query)
    .filter().sort().limitFields().paginate();
  const exams = await features.query;
  res.status(200).json({ status: 'success', results: exams.length, data: { exams } });
});

// @desc    Get a single exam
export const getExam = catchAsync(async (req, res, next) => {
  const exam = await Exam.findById(req.params.id).populate('sections.questionList');
  if (!exam) {
    return next(new AppError('No exam found with that ID', 404));
  }
  res.status(200).json({ status: 'success', data: { exam } });
});

// @desc    Create a new exam
export const createExam = catchAsync(async (req, res, next) => {
  const newExam = await Exam.create({ ...req.body, author: req.user.id });
  res.status(201).json({ status: 'success', data: { exam: newExam } });
});

// @desc    Update an exam
export const updateExam = catchAsync(async (req, res, next) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!exam) {
    return next(new AppError('No exam found with that ID', 404));
  }
  res.status(200).json({ status: 'success', data: { exam } });
});

// @desc    Delete an exam
export const deleteExam = catchAsync(async (req, res, next) => {
  const exam = await Exam.findByIdAndDelete(req.params.id);
  if (!exam) {
    return next(new AppError('No exam found with that ID', 404));
  }
  res.status(204).json({ status: 'success', data: null });
});


// --- Chức năng IMPORT mới ---

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const buildExamImportPrompt = (examText) => {
  // Đây là "siêu prompt" hướng dẫn AI cách xử lý văn bản
  return `
    Act as an expert exam creator and data extractor. I will provide you with the full text content of an exam extracted from a Word document. 
    Your task is to analyze this text and convert it into a single, valid JSON object.

    The text contains all the information about an exam, including its title, sections, and a series of questions with their options and correct answers.

    **CRITICAL INSTRUCTIONS:**
    1.  **Parse the Entire Text:** Read and understand the structure of the exam provided.
    2.  **Identify Exam Details:** Extract the main title of the exam, determine its type (e.g., "TOEIC", "IELTS", "General Knowledge"), and estimate the duration in minutes (if not specified, make a reasonable guess based on the number of questions).
    3.  **Process Each Question:** For every question you find, you must extract:
        *   The question content itself.
        *   The multiple-choice options (A, B, C, D, etc.).
        *   The single correct answer.
    4.  **Generate Explanations:** For each question, you MUST generate a clear and concise explanation for why the correct answer is correct. This is a mandatory field.
    5.  **Structure the Output:** The final output MUST be a single, clean JSON object with no markdown formatting (like \`\`\`json), no comments, and no extra text before or after it. The JSON object must have the following structure:
        {
          "examDetails": {
            "title": "(The extracted exam title)",
            "type": "(The determined exam type, e.g., TOEIC)",
            "duration": (The estimated duration in minutes, as a number),
            "sections": [
              {
                "sectionName": "(A suitable name for the section, e.g., Part 5: Incomplete Sentences)",
                "description": "(A brief description of the section)"
              }
            ]
          },
          "questions": [
            // Array of question objects
            {
              "category": "(The exam type, e.g., TOEIC)",
              "part": (The part number, e.g., 5, infer if possible),
              "format": "MULTIPLE_CHOICE",
              "subQuestions": [{
                "content": "(The question content)",
                "options": ["(Option A)", "(Option B)", "(Option C)", "(Option D)"],
                "correctAnswer": ["(The text of the correct answer)"],
                "explanation": "(The explanation you generated)"
              }],
              "metadata": {
                "level": "(Estimate the difficulty, e.g., Medium)"
              }
            }
            // ... more questions
          ]
        }

    **HERE IS THE EXAM TEXT:**
    ------------------------------------
    ${examText}
    ------------------------------------

    Now, generate the complete JSON object based on the text provided.
  `;
};

// @desc    Import an exam from a Word document
// @route   POST /api/exams/import-word
// @access  Private (Admin, Teacher)
export const importExamFromWord = catchAsync(async (req, res, next) => {
  // 1. Kiểm tra file đã được tải lên chưa
  if (!req.file) {
    return next(new AppError('Please upload a Word document.', 400));
  }

  // 2. Đọc nội dung text từ buffer của file Word
  const { value: examText } = await mammoth.extractRawText({ buffer: req.file.buffer });

  if (!examText) {
    return next(new AppError('Could not read the content of the Word document.', 400));
  }

  // 3. Gửi văn bản đến Gemini AI để xử lý
  const prompt = buildExamImportPrompt(examText);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  let textResponse = response.text();
  
  // 4. Dọn dẹp và Parse phản hồi JSON từ AI
  textResponse = textResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  let parsedData;
  try {
    parsedData = JSON.parse(textResponse);
  } catch (parseError) {
    console.error('Failed to parse AI response:', textResponse); 
    return next(new AppError('The AI returned an invalid format. Please check the Word document structure and try again.', 500));
  }

  const { examDetails, questions } = parsedData;

  if (!examDetails || !questions || !Array.isArray(questions) || questions.length === 0) {
      return next(new AppError('Invalid data structure from AI. Missing examDetails or questions.', 500));
  }

  // 5. Lưu các câu hỏi vào database
  const createdQuestions = await Question.insertMany(questions);
  const questionIds = createdQuestions.map(q => q._id);

  // 6. Tạo bài thi mới với các câu hỏi đã được tạo
  const examData = { ...examDetails };
  examData.author = req.user.id; // Gán tác giả
  examData.sections[0].questionList = questionIds; // Gán danh sách ID câu hỏi vào section đầu tiên
  examData.metadata = { isPublished: false, difficulty: 'Medium' }; // Thêm metadata mặc định

  const newExam = await Exam.create(examData);

  // 7. Gửi phản hồi thành công
  res.status(201).json({
    status: 'success',
    message: `Successfully imported ${createdQuestions.length} questions and created the exam '${newExam.title}'.`,
    data: {
      exam: newExam
    }
  });
});

/**
 * @desc    Chấm điểm bài thi và cung cấp kết quả chi tiết
 * @route   POST /api/exams/:id/grade
 * @access  Private
 * @body    { "answers": { "questionId1": "userAnswer1", "questionId2": "userAnswer2" } }
 */
export const gradeExam = catchAsync(async (req, res, next) => {
  // 1. Tìm bài thi và populate toàn bộ câu hỏi liên quan
  const exam = await Exam.findById(req.params.id).populate({
    path: 'sections',
    populate: {
      path: 'questionList',
      model: 'Question'
    }
  });

  if (!exam) {
    return next(new AppError('Không tìm thấy bài thi với ID này.', 404));
  }

  const userAnswers = req.body.answers; // Lấy câu trả lời của người dùng từ body
  if (!userAnswers || typeof userAnswers !== 'object'){
      return next(new AppError('Định dạng câu trả lời không hợp lệ.', 400));
  }

  let correctAnswersCount = 0;
  let totalQuestions = 0;
  const detailedResults = [];

  // 2. Lặp qua từng câu hỏi để chấm điểm
  for (const section of exam.sections) {
    for (const question of section.questionList) {
      totalQuestions++;
      const questionId = question._id.toString();
      const userAnswer = userAnswers[questionId];
      const correctAnswer = question.subQuestions[0].correctAnswer[0];

      const isCorrect = userAnswer && userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

      if (isCorrect) {
        correctAnswersCount++;
      }

      // 3. Xây dựng đối tượng kết quả chi tiết cho mỗi câu
      detailedResults.push({
        questionId,
        content: question.subQuestions[0].content,
        userAnswer: userAnswer || "Chưa trả lời",
        correctAnswer,
        isCorrect,
        explanation: question.subQuestions[0].explanation,
      });
    }
  }

  // 4. Tính điểm dựa trên loại bài thi
  let score = 0;
  if (totalQuestions > 0) {
    switch (exam.type) {
      case 'TOEIC':
        score = Math.round((correctAnswersCount / totalQuestions) * 990);
        break;
      case 'THPT':
        score = parseFloat(((correctAnswersCount / totalQuestions) * 10).toFixed(2));
        break;
      default:
        score = correctAnswersCount; // Mặc định tính điểm là số câu đúng
    }
  }

  // 5. Trả về kết quả tổng quan và chi tiết
  res.status(200).json({
    status: 'success',
    data: {
      examId: exam._id,
      examTitle: exam.title,
      score,
      correctAnswers: correctAnswersCount,
      totalQuestions,
      detailedResults, // Mảng kết quả chi tiết
    },
  });
});
