const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { getProfile, updateProfile, requestUniversityVerification, verifyUniversityEmail } = require('../controllers/user.controller');

// All user routes require authentication
router.use(authenticate);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.post('/request-university-verification', requestUniversityVerification);
router.post('/verify-university-email', verifyUniversityEmail);

module.exports = router;

