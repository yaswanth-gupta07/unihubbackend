const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  createReview,
  getFreelancerReviews,
  getJobReview,
} = require('../controllers/review.controller');

// All review routes require authentication
router.use(authenticate);

router.post('/', createReview);
router.get('/freelancer/:freelancerId', getFreelancerReviews);
router.get('/job/:jobId', getJobReview);

module.exports = router;

