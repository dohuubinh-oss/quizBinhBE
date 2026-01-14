import express from 'express';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';
import blogRoutes from './routes/blogRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import examRoutes from './routes/examRoutes.js';

const app = express();

// Middlewares
app.use(express.json());

// Routes
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/exams', examRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
