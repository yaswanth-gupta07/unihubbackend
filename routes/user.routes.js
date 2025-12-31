const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { getProfile, updateProfile } = require('../controllers/user.controller');

// All user routes require authentication
router.use(authenticate);

router.get('/me', getProfile);
router.put('/me', updateProfile);

module.exports = router;

