import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng cung cấp tiêu đề'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Vui lòng cung cấp nội dung']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Bài đăng phải có tác giả']
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.split(' ').join('-').toLowerCase();
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
