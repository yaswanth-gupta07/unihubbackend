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
      trim: true,
      index: true, // Indexed for faster queries
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

