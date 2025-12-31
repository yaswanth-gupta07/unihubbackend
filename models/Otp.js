const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
otpSchema.index({ email: 1, otp: 1 });

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;

