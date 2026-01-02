const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      required: true,
      enum: ['New', 'Good', 'Used'],
      trim: true,
    },
    images: {
      type: [String], // Array of Cloudinary URLs
      default: [],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    universityId: {
      type: String, // Stored as string matching user.university
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['AVAILABLE', 'RESERVED', 'SOLD'],
      default: 'AVAILABLE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
productSchema.index({ universityId: 1, status: 1 });
productSchema.index({ universityId: 1, sellerId: 1, status: 1 });
productSchema.index({ category: 1, universityId: 1, status: 1 });
// Index for category queries
productSchema.index({ category: 1, status: 1 });
// Index for createdAt descending (sorting feed results)
productSchema.index({ createdAt: -1 });
// Compound index for university + createdAt (feed queries)
productSchema.index({ universityId: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

