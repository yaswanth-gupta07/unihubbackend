const Otp = require('../models/Otp');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const generateOtp = require('../utils/generateOtp');
const sendBrevoEmail = require('../utils/brevoEmail');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Send OTP to user's email
 * POST /api/auth/send-otp
 */
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('OTP request received for email:', email);

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate 6-digit OTP
    const otpCode = generateOtp();
    console.log('OTP generated for:', normalizedEmail);

    // Set expiry to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail });

    // Save OTP to database
    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      expiresAt,
    });

    // Prepare email content
    const emailSubject = 'Your UniHub Login OTP';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 10px;
              border: 1px solid #ddd;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #4CAF50;
              text-align: center;
              letter-spacing: 5px;
              padding: 20px;
              background-color: #fff;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to UniHub!</h2>
            <p>Hello,</p>
            <p>Your login OTP code is:</p>
            <div class="otp-code">${otpCode}</div>
            <p><strong>This code will expire in 5 minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
            <div class="footer">
              <p><strong>Security Note:</strong> Never share your OTP with anyone. UniHub staff will never ask for your OTP.</p>
              <p>© UniHub - Connecting University Communities</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email in background (non-blocking)
    console.log('Background email sending started for:', normalizedEmail);
    setTimeout(async () => {
      try {
        await sendBrevoEmail(normalizedEmail, emailSubject, emailHtml);
        console.log('OTP email sent successfully:', normalizedEmail);
      } catch (err) {
        console.error('Background OTP email failed:', err.message);
        // Email failure does not block the API response
      }
    }, 0);

    // Return response immediately without waiting for email
    res.status(200).json({
      success: true,
      message: 'OTP generated and email will be sent shortly',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
    });
  }
};

/**
 * Verify OTP and authenticate user
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find OTP in database
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp: otp.toString(),
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create new user
      user = await User.create({
        email: normalizedEmail,
      });
    }

    // Generate access token (24 hours)
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate refresh token (30 days)
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Save refresh token to database
    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenValue,
      expiresAt: refreshTokenExpiry,
      isRevoked: false,
    });

    // Delete OTP after successful verification
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          university: user.university,
          skills: user.skills,
          about: user.about,
          profileComplete: !!(user.name && user.university && user.skills.length > 0 && user.about),
        },
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.',
    });
  }
};

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: refreshTokenValue } = req.body;

    if (!refreshTokenValue) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Find refresh token in database
    const refreshTokenRecord = await RefreshToken.findOne({
      token: refreshTokenValue,
      isRevoked: false,
    });

    if (!refreshTokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked refresh token',
      });
    }

    // Check if refresh token is expired
    if (new Date() > refreshTokenRecord.expiresAt) {
      await RefreshToken.deleteOne({ _id: refreshTokenRecord._id });
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please login again.',
      });
    }

    // Get user
    const user = await User.findById(refreshTokenRecord.userId);

    if (!user) {
      await RefreshToken.deleteOne({ _id: refreshTokenRecord._id });
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new access token (24 hours)
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          university: user.university,
          skills: user.skills,
          about: user.about,
          profileComplete: !!(user.name && user.university && user.skills.length > 0 && user.about),
        },
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
    });
  }
};

/**
 * Logout - invalidate refresh token
 * POST /api/auth/logout
 * Note: This endpoint doesn't require authentication to allow logout even with expired tokens
 */
const logout = async (req, res) => {
  try {
    const { refreshToken: refreshTokenValue } = req.body;

    if (refreshTokenValue) {
      // Find and revoke refresh token
      const refreshTokenRecord = await RefreshToken.findOne({
        token: refreshTokenValue,
      });

      if (refreshTokenRecord) {
        refreshTokenRecord.isRevoked = true;
        await refreshTokenRecord.save();
      }
    }

    // If user is authenticated, also revoke all refresh tokens for this user (optional - for security)
    // Uncomment if you want to logout from all devices when user explicitly logs out
    // if (req.user && req.user._id) {
    //   await RefreshToken.updateMany(
    //     { userId: req.user._id },
    //     { isRevoked: true }
    //   );
    // }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  refreshToken,
  logout,
};

