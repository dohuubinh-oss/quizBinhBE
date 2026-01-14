import Exam from '../models/examModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';

// @desc    Get all exams
// @route   GET /api/v1/exams
// @access  Public
export const getAllExams = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Exam.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const exams = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: exams.length,
    data: {
      exams
    }
  });
});
