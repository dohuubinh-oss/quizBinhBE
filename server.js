import './config/env.js'; // Must be the very first import

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { GoogleGenerativeAI } from '@google/generative-ai';

import connectDB from './config/db.js';
import './config/passport.js'; // Import passport config
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';

import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import examRoutes from './routes/examRoutes.js';
import blogRoutes from './routes/blogRoutes.js';

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Express session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Check for API key on startup
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

// Initialize the Google AI client with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/blogs', blogRoutes);

// Gemini API Route
app.post('/api/generate', async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return next(new AppError('Prompt is required', 400));
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ generatedText: text });
  } catch (error) {
    
    console.error('Error calling Gemini API:', error);
    
    next(new AppError('Failed to generate content from API', 500));
  }
});

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can\'t find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
