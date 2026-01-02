const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
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
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    deadline: {
      type: Date,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Expert'],
    },
    skillsRequired: {
      type: [String],
      default: [],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    university: {
      type: String,
      required: true,
      index: true, // Indexed for faster university-based queries
    },
    status: {
      type: String,
      required: true,
      enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
jobSchema.index({ university: 1, status: 1 });
jobSchema.index({ postedBy: 1, status: 1 });
// Index for assignedTo (freelancer) queries
jobSchema.index({ assignedTo: 1, status: 1 });
// Index for createdAt descending (sorting feed results)
jobSchema.index({ createdAt: -1 });
// Compound index for university + createdAt (feed queries)
jobSchema.index({ university: 1, status: 1, createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;

