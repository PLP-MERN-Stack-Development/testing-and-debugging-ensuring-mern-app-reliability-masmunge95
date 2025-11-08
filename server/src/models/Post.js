// Post.js - Mongoose model for blog posts

const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
    },
    featuredImage: {
      type: String,
      default: 'default-post.jpg',
    },
    slug: {
      type: String,
      unique: true,
    },
    excerpt: {
      type: String,
      maxlength: [200, 'Excerpt cannot be more than 200 characters'],
    },
    author: {
      type: String,
      default: 'Anonymous',
    },
    authorId: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    tags: [String],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    viewedBy: [
      {
        userId: { type: String, required: true },
        lastViewed: { type: Date, required: true },
      },
    ],
    comments: [
      {
        userId: {
          type: String,
          required: true,
        },
        user: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Create slug from title before saving
PostSchema.pre('save', function (next) {
  if (!this.isModified('title')) {
    return next();
  }
  
  this.slug = slugify(this.title);
  next();
});

// Extract excerpt from content before saving
PostSchema.pre('save', function (next) {
  if (!this.isModified('content')) {
    return next();
  }

  this.excerpt = this.content.substring(0, 197) + (this.content.length > 200 ? '...' : '');
  next();
});

// Generate SEO-friendly tags before saving
PostSchema.pre('save', function (next) {
  if (this.tags && this.tags.length > 0) {
    this.tags = this.tags.map(tag => tag.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'));
  }
  next();
});

// Virtual for post URL
PostSchema.virtual('url').get(function () {
  return `/posts/${this.slug}`;
});

// Method to add a comment
PostSchema.methods.addComment = function (userId, userName, content) {
  this.comments.push({ userId, user: userName, content });
  return this.save();
};

module.exports = mongoose.model('Post', PostSchema); 