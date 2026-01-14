import Blog from '../models/blogModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import APIFeatures from '../utils/apiFeatures.js';

// @desc    Get all blog posts
// @route   GET /api/v1/blogs
// @access  Public
export const getAllBlogs = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Blog.find().populate('author', 'name'), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const blogs = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: blogs.length,
    data: {
      blogs
    }
  });
});

// @desc    Get single blog post
// @route   GET /api/v1/blogs/:slug
// @access  Public
export const getBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name');

  if (!blog) {
    return next(new AppError('No blog found with that slug', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      blog
    }
  });
});

// @desc    Create a new blog post
// @route   POST /api/v1/blogs
// @access  Private
export const createBlog = catchAsync(async (req, res, next) => {
  // Assuming the user's ID is available on req.user from the auth middleware
  const newBlog = await Blog.create({ ...req.body, author: req.user.id });

  res.status(201).json({
    status: 'success',
    data: {
      blog: newBlog
    }
  });
});

// @desc    Update a blog post
// @route   PATCH /api/v1/blogs/:id
// @access  Private
export const updateBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!blog) {
    return next(new AppError('No blog found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      blog
    }
  });
});

// @desc    Delete a blog post
// @route   DELETE /api/v1/blogs/:id
// @access  Private
export const deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);

  if (!blog) {
    return next(new AppError('No blog found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
