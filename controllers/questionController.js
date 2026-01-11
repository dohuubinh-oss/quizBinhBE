import Question from '../models/questionModel.js';

/**
 * @description Helper function to validate a single question object.
 * @param {object} question - The question object to validate.
 * @param {number} index - The index of the question in the original array for error reporting.
 * @returns {string[]} An array of error messages. Empty if the question is valid.
 */
const validateQuestion = (question, index) => {
  const errors = [];
  const { category, part, format, metadata, subQuestions } = question;
  const questionId = `Câu hỏi #${index + 1}`;

  if (!category) errors.push(`${questionId}: Thiếu trường 'category'.`);
  if (part == null) errors.push(`${questionId}: Thiếu trường 'part'.`);
  if (!format) errors.push(`${questionId}: Thiếu trường 'format'.`);
  if (!metadata || metadata.level == null) errors.push(`${questionId}: Thiếu trường 'metadata.level'.`);

  if (!subQuestions || !Array.isArray(subQuestions) || subQuestions.length === 0) {
    errors.push(`${questionId}: Phải có ít nhất một câu hỏi con trong 'subQuestions'.`);
    // If no subQuestions, no need to validate them further.
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

    // --- Case-specific validation ---
    if (format === 'MULTIPLE_CHOICE') {
      if (!sq.options || !Array.isArray(sq.options) || sq.options.length < 2) {
        errors.push(`${subQuestionId}: Với format MULTIPLE_CHOICE, 'options' phải là một mảng có ít nhất 2 lựa chọn.`);
      } else if (sq.correctAnswer) {
        // Check if every correct answer is actually in the options list.
        for (const answer of sq.correctAnswer) {
          if (!sq.options.includes(answer)) {
            errors.push(`${subQuestionId}: Đáp án đúng "${answer}" không tồn tại trong danh sách 'options'.`);
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
const bulkImportQuestions = async (req, res) => {
  const { questions } = req.body;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Dữ liệu gửi lên không hợp lệ. Cần một mảng "questions" không rỗng.' });
  }

  // --- Pre-save Validation Step ---
  const allValidationErrors = [];
  questions.forEach((question, index) => {
    const errors = validateQuestion(question, index);
    if (errors.length > 0) {
      allValidationErrors.push(...errors);
    }
  });

  if (allValidationErrors.length > 0) {
    return res.status(400).json({
      message: 'Phát hiện dữ liệu không hợp lệ. Vui lòng sửa các lỗi sau và thử lại.',
      errors: allValidationErrors,
    });
  }
  // --- End of Validation Step ---

  try {
    // If validation passes, attempt to insert into the database.
    // Mongoose will perform its own final schema validation here as a last line of defense.
    const createdQuestions = await Question.insertMany(questions, { ordered: false });
    
    res.status(201).json({
      message: `Thêm thành công ${createdQuestions.length} câu hỏi.`,
      data: createdQuestions
    });
  } catch (error) {
    console.error('Lỗi khi import hàng loạt (sau khi đã validate):', error);
    res.status(500).json({ 
      message: 'Đã xảy ra lỗi ở phía server trong quá trình ghi vào database.',
      error: error.message,
      // This will catch errors if Mongoose validation fails for some edge case.
      writeErrors: error.writeErrors 
    });
  }
};

export { bulkImportQuestions };
