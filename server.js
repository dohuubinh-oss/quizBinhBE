import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import AppError from './utils/appError.js'; // Import AppError

import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import examRoutes from './routes/examRoutes.js';
import blogRoutes from './routes/blogRoutes.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
// Tăng giới hạn của request body để cho phép import file JSON lớn
app.use(express.json({ limit: '10mb' })); 
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/blogs', blogRoutes);

// Global Error Handling Middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Production error handling
  let error = { ...err };
  error.message = err.message;

  // Handle specific Mongoose/JWT errors for production
  if (error.name === 'CastError') {
      const message = `Invalid ${error.path}: ${error.value}.`;
      error = new AppError(message, 400);
  }
  if (error.code === 11000) {
      const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
      const message = `Duplicate field value: ${value}. Please use another value!`;
      error = new AppError(message, 400);
  }
  if (error.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => el.message);
      const message = `Invalid input data. ${errors.join('. ')}`;
      error = new AppError(message, 400);
  }
  if (error.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again!', 401);
  }
  if (error.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired! Please log in again.', 401);
  }

  // Send response based on error type
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message
    });
  }

  // For programming or other unknown errors, log and send generic message
  console.error('ERROR 💥', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong on the server!'
  });
};

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
