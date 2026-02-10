import Question from '../models/questionModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';

export const getAllQuestions = catchAsync(async (req, res, next) => {
    // EXECUTE QUERY
    const features = new APIFeatures(Question.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const questions = await features.query;
  
    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: questions.length,
      data: {
        questions
      }
    });
  });

export const getQuestion = catchAsync(async (req, res, next) => {
    const question = await Question.findById(req.params.id);

    if (!question) {
        return next(new AppError('No question found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            question
        }
    });
});

export const createQuestion = catchAsync(async (req, res, next) => {
    const newQuestion = await Question.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            question: newQuestion
        }
    });
});

export const updateQuestion = catchAsync(async (req, res, next) => {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!question) {
        return next(new AppError('No question found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            question
        }
    });
});

export const deleteQuestion = catchAsync(async (req, res, next) => {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
        return next(new AppError('No question found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

/**
 * @description Helper function to validate a single question object.
 * @param {object} question - The question object to validate.
 * @param {number} index - The index of the question in the original array for error reporting.
 * @returns {string[]} An array of error messages. Empty if the question is valid.
 */
const validateQuestion = (question, index) => {
  const errors = [];
  const { category, part, topic, format, metadata, subQuestions } = question;
  const questionId = `Câu hỏi #${index + 1}`;

  if (!category) errors.push(`${questionId}: Thiếu trường 'category'.`);
  if (part == null) errors.push(`${questionId}: Thiếu trường 'part'.`);
  if (!topic) errors.push(`${questionId}: Thiếu trường 'topic'.`);
  if (!format) errors.push(`${questionId}: Thiếu trường 'format'.`);
  
  if (!metadata || !metadata.level) {
    errors.push(`${questionId}: Thiếu trường 'metadata.level'.`);
  } else {
    const allowedLevels = ['Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'];
    if (!allowedLevels.includes(metadata.level)) {
        errors.push(`${questionId}: 'metadata.level' không hợp lệ. Giá trị phải là một trong ${allowedLevels.join(', ')}.`);
    }
  }

  if (!subQuestions || !Array.isArray(subQuestions) || subQuestions.length === 0) {
    errors.push(`${questionId}: Phải có ít nhất một câu hỏi con trong 'subQuestions'.`);
    return errors;
  }

  subQuestions.forEach((sq, sqIndex) => {
    const subQuestionId = `${questionId}, câu hỏi con #${sqIndex + 1}`;
    if (!sq.content) {
      errors.push(`${subQuestionId}: Thiếu trường 'content'.`);
    }
    if (!sq.correctAnswer || !Array.isArray(sq.correctAnswer) || sq.correctAnswer.length === 0) {
      errors.push(`${subQuestionId}: Trường 'correctAnswer' phải là một mảng không rỗng.`);
    }

    if (format === 'MULTIPLE_CHOICE') {
      if (!sq.options || !Array.isArray(sq.options) || sq.options.length < 2) {
        errors.push(`${subQuestionId}: Với format MULTIPLE_CHOICE, 'options' phải là một mảng có ít nhất 2 lựa chọn.`);
      } else if (sq.correctAnswer) {
        for (const answer of sq.correctAnswer) {
          if (!sq.options.includes(answer)) {
            errors.push(`${subQuestionId}: Đáp án đúng \"${answer}\" không tồn tại trong danh sách 'options'.`);
          }
        }
      }
    }
  });

  return errors;
};

// @desc    Import hàng loạt câu hỏi từ một mảng JSON
// @route   POST /api/questions/import
// @access  Private/Admin
export const bulkImportQuestions = catchAsync(async (req, res, next) => {
  const { questions } = req.body;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return next(new AppError('Dữ liệu gửi lên không hợp lệ. Cần một mảng "questions" không rỗng.', 400));
  }

  const allValidationErrors = [];
  questions.forEach((question, index) => {
    const errors = validateQuestion(question, index);
    if (errors.length > 0) {
      allValidationErrors.push(...errors);
    }
  });

  if (allValidationErrors.length > 0) {
    const errorMessage = `Phát hiện dữ liệu không hợp lệ. Vui lòng sửa các lỗi sau và thử lại. Lỗi: ${allValidationErrors.join('; ')}`;
    return next(new AppError(errorMessage, 400));
  }

  const createdQuestions = await Question.insertMany(questions, { ordered: false });
  
  res.status(201).json({
    message: `Thêm thành công ${createdQuestions.length} câu hỏi.`,
    data: createdQuestions
  });
});
