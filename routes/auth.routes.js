const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, refreshToken, logout } = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');

// Public routes (no authentication required)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout); // Logout doesn't require auth (allows logout with expired tokens)

module.exports = router;

