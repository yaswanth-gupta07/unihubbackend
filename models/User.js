const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    university: {
      type: String,
      enum: ['SRM_AP', 'KLU'],
      trim: true,
      index: true, // Indexed for faster queries
    },
    universityEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    isUniversityVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    universityVerificationOtp: {
      type: String,
      default: null,
    },
    universityVerificationOtpExpiry: {
      type: Date,
      default: null,
    },
    pendingUniversityEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    about: {
      type: String,
      trim: true,
    },
    yearOfStudy: {
      type: String,
      trim: true,
    },
    profession: {
      type: String,
      trim: true,
      enum: ['Student', 'Professional', 'Graduate', 'Other'],
    },
    profileImage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;

