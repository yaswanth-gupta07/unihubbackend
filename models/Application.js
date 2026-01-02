const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    coverLetter: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    budget: {
      type: Number,
      min: 0,
    },
    pricingType: {
      type: String,
      enum: ['Fixed', 'Hourly', 'Per Task'],
      trim: true,
    },
    deliveryDays: {
      type: Number,
      min: 1,
    },
    skills: {
      type: [String],
      default: [],
    },
    portfolioLink: {
      type: String,
      trim: true,
    },
    agreementAccepted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });
// Index for freelancer queries
applicationSchema.index({ freelancerId: 1, createdAt: -1 });
// Index for job queries (client view)
applicationSchema.index({ jobId: 1, createdAt: -1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;

