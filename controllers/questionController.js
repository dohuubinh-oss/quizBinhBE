import Question from '../models/questionModel.js';
import AppError from '../utils/appError.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Restored CRUD Functions ---

// @desc    Get all questions
// @route   GET /api/questions
export const getAllQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find(req.query);
    res.status(200).json({
      status: 'success',
      results: questions.length,
      data: { questions },
    });
  } catch (error) {
    next(new AppError('Error fetching questions', 500));
  }
};

// @desc    Get a single question by ID
// @route   GET /api/questions/:id
export const getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return next(new AppError('No question found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { question },
    });
  } catch (error) {
    next(new AppError('Error fetching question', 500));
  }
};

// @desc    Create a new question
// @route   POST /api/questions
export const createQuestion = async (req, res, next) => {
  try {
    const newQuestion = await Question.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { question: newQuestion },
    });
  } catch (error) {
    next(new AppError('Error creating question. Please check input data.', 400));
  }
};

// @desc    Update a question by ID
// @route   PATCH /api/questions/:id
export const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!question) {
      return next(new AppError('No question found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { question },
    });
  } catch (error) {
    next(new AppError('Error updating question. Please check input data.', 400));
  }
};

// @desc    Delete a question by ID
// @route   DELETE /api/questions/:id
export const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return next(new AppError('No question found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(new AppError('Error deleting question', 500));
  }
};

// @desc    Bulk import questions
// @route   POST /api/questions/import
export const bulkImportQuestions = async (req, res, next) => {
    try {
        const questions = req.body; // Expecting an array of questions
        if (!Array.isArray(questions) || questions.length === 0) {
            return next(new AppError('Please provide an array of questions for bulk import.', 400));
        }
        const createdQuestions = await Question.insertMany(questions);
        res.status(201).json({
            status: 'success',
            message: `${createdQuestions.length} questions imported successfully.`,
            data: { questions: createdQuestions }
        });
    } catch (error) {
        next(new AppError('An error occurred during bulk import.', 500));
    }
};

// --- AI Generation Function ---

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const buildPrompt = ({ topic, level, part, category, format }) => {
  let prompt = `Act as an expert English language test creator. Your task is to generate a single, complete question object in a valid JSON format. Do not include any text or markdown formatting before or after the JSON object itself.\n\n`;
  prompt += `The question must strictly adhere to the following criteria:\n`;
  prompt += `- Category: '${category}'\n`;
  prompt += `- Part: ${part}\n`;
  prompt += `- Topic: '${topic}'\n`;
  prompt += `- Level: '${level}'\n`;
  prompt += `- Format: '${format}'\n\n`;
  prompt += `The output MUST be a single JSON object with the following structure. Pay close attention to the data types (string, number, array).\n\`\`\`json\n{\n    \"category\": \"${category}\",\n    \"part\": ${part},\n    \"topic\": \"${topic}\",\n    \"format\": \"${format}\",\n    \"resource\": {\n      \"audioUrl\": null,\n      \"imageUrl\": null,\n      \"passages\": []\n    },\n    \"subQuestions\": [\n      {\n        \"content\": \"(The generated question content goes here)\",\n        \"options\": [\"(Option A)\", \"(Option B)\", \"(Option C)\", \"(Option D)\"],\n        \"correctAnswer\": [\"(The single correct answer text, which must match one of the options)\"],\n        \"explanation\": \"(A clear and concise explanation for why the answer is correct)\"\n      }\n    ],\n    \"metadata\": {\n      \"level\": \"${level}\"\n    }\n}\n\`\`\`\n\n`;
  prompt += `Based on the topic of \'${topic}\' at a \'${level}\' difficulty, generate the complete JSON object now.`
  return prompt;
};

export const generateQuestion = async (req, res, next) => {
  try {
    const { topic, level, part, category, format } = req.body;
    if (!topic || !level || !part || !category || !format) {
      return next(new AppError('Missing required fields: topic, level, part, category, format', 400));
    }
    const prompt = buildPrompt({ topic, level, part, category, format });
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    let questionJSON;
    try {
      questionJSON = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text); 
      return next(new AppError('Failed to parse the generated question from the AI. Please try again.', 500));
    }
    res.status(200).json({
      status: 'success',
      data: questionJSON
    });
  } catch (error) {
    console.error('Error in generateQuestion controller:', error);
    next(new AppError('An error occurred while generating the question.', 500));
  }
};
