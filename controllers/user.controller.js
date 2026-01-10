const User = require('../models/User');
const generateOtp = require('../utils/generateOtp');
const sendBrevoEmail = require('../utils/brevoEmail');

/**
 * Get current user profile
 * GET /api/users/me
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          university: user.university,
          universityEmail: user.universityEmail,
          isUniversityVerified: user.isUniversityVerified,
          skills: user.skills,
          about: user.about,
          yearOfStudy: user.yearOfStudy,
          profession: user.profession,
          profileImage: user.profileImage,
          profileComplete: !!(user.name && user.university && user.skills.length > 0 && user.about),
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
};

/**
 * Update user profile
 * PUT /api/users/me
 * 
 * CAMPUS-ONLY RULE: University can only be set once during initial profile setup.
 * After that, it becomes locked and cannot be changed.
 */
const updateProfile = async (req, res) => {
  try {
    const { name, university, skills, about, yearOfStudy, profession, profileImage } = req.body;

    // Get current user to check if university is already set
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // CAMPUS-ONLY SECURITY: If university is already set, prevent any changes to it
    if (currentUser.university && university && university.trim() !== currentUser.university.trim()) {
      return res.status(403).json({
        success: false,
        message: 'University cannot be changed after profile setup.',
      });
    }

    // SECURITY: Prevent editing universityEmail after verification
    if (currentUser.isUniversityVerified && req.body.universityEmail !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'University email cannot be edited after verification.',
      });
    }

    // If university is provided and user doesn't have one yet, this is initial setup
    const isInitialSetup = !currentUser.university && university;
    
    // Validate required fields based on context
    if (isInitialSetup) {
      // Initial setup: all fields required including university
      if (!name || !university || !skills || !Array.isArray(skills) || skills.length === 0 || !about) {
        return res.status(400).json({
          success: false,
          message: 'Name, university, skills (non-empty array), and about are required for initial profile setup',
        });
      }
    } else {
      // Update existing profile: university not required (and will be ignored if provided)
      if (!name || !skills || !Array.isArray(skills) || skills.length === 0 || !about) {
        return res.status(400).json({
          success: false,
          message: 'Name, skills (non-empty array), and about are required',
        });
      }
    }

    // Build update object - only include university if it's initial setup
    const updateData = {
      name: name.trim(),
      skills: skills.map(skill => skill.trim()).filter(skill => skill.length > 0),
      about: about.trim(),
    };

    // Add optional fields if provided
    // If field is explicitly provided (even if null/empty), update it
    if (yearOfStudy !== undefined) {
      updateData.yearOfStudy = (yearOfStudy && typeof yearOfStudy === 'string') ? yearOfStudy.trim() || null : null;
    }
    if (profession !== undefined) {
      updateData.profession = (profession && typeof profession === 'string') ? profession.trim() || null : null;
    }
    if (profileImage !== undefined) {
      updateData.profileImage = (profileImage && typeof profileImage === 'string') ? profileImage.trim() || null : null;
    }

    // Only set university if it's initial setup (user doesn't have one yet)
    if (isInitialSetup) {
      updateData.university = university.trim();
    }
    // If university is provided but user already has one, ignore it (already validated above)

    // Update user profile
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: isInitialSetup ? 'Profile setup completed successfully' : 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          university: user.university,
          universityEmail: user.universityEmail,
          isUniversityVerified: user.isUniversityVerified,
          skills: user.skills,
          about: user.about,
          yearOfStudy: user.yearOfStudy,
          profession: user.profession,
          profileImage: user.profileImage,
          profileComplete: !!(user.name && user.university && user.skills.length > 0 && user.about),
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

/**
 * Request university email verification
 * POST /api/users/request-university-verification
 */
const requestUniversityVerification = async (req, res) => {
  try {
    const { universityEmail } = req.body;

    if (!universityEmail || typeof universityEmail !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'University email is required',
      });
    }

    const normalizedEmail = universityEmail.toLowerCase().trim();

    // Get user with current university
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has university set
    if (!user.university || user.university.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please set your university in profile first',
      });
    }

    // Check if already verified
    if (user.isUniversityVerified) {
      return res.status(400).json({
        success: false,
        message: 'University email is already verified',
      });
    }

    // Validate email domain based on university
    // Normalize university value to handle variations (SRM_AP, SRM AP, SRMAP, etc.)
    const normalizedUniversity = user.university.trim().toUpperCase().replace(/\s+/g, '_');
    
    let expectedDomain = '';
    let universityDisplayName = '';
    
    if (normalizedUniversity === 'SRM_AP' || normalizedUniversity === 'SRMAP') {
      expectedDomain = '@srmap.edu.in';
      universityDisplayName = 'SRM AP';
    } else if (normalizedUniversity === 'KLU') {
      expectedDomain = '@kluniversity.in';
      universityDisplayName = 'KLU';
    } else {
      // Log the actual university value for debugging
      console.log('Invalid university value:', user.university, 'Normalized:', normalizedUniversity);
      return res.status(400).json({
        success: false,
        message: `Invalid university "${user.university}". Only SRM AP and KLU are supported. Please update your profile with a valid university.`,
      });
    }

    // Strict domain validation
    if (!normalizedEmail.endsWith(expectedDomain)) {
      return res.status(400).json({
        success: false,
        message: `Email must end with ${expectedDomain} for ${universityDisplayName}`,
      });
    }

    // Generate 6-digit OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP and pending email in user document
    user.universityVerificationOtp = otpCode;
    user.universityVerificationOtpExpiry = expiresAt;
    user.pendingUniversityEmail = normalizedEmail;
    await user.save();

    // Send OTP email via Brevo
    const emailSubject = 'UniHub University Email Verification';
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
            <h2>Verify Your University Email</h2>
            <p>Hello,</p>
            <p>You requested to verify your university email for UniHub.</p>
            <p>Your verification code is:</p>
            <div class="otp-code">${otpCode}</div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
            <div class="footer">
              <p>© UniHub – Connecting University Communities</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email in background (non-blocking)
    setImmediate(() => {
      sendBrevoEmail(normalizedEmail, emailSubject, emailHtml).catch((emailError) => {
        console.error('Failed to send university verification email:', emailError);
        // Email failure doesn't affect the response
      });
    });

    res.status(200).json({
      success: true,
      message: 'Verification OTP sent to your university email',
    });
  } catch (error) {
    console.error('Request university verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification OTP. Please try again.',
    });
  }
};

/**
 * Verify university email with OTP
 * POST /api/users/verify-university-email
 */
const verifyUniversityEmail = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || typeof otp !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already verified
    if (user.isUniversityVerified) {
      return res.status(400).json({
        success: false,
        message: 'University email is already verified',
      });
    }

    // Check if OTP exists
    if (!user.universityVerificationOtp) {
      return res.status(400).json({
        success: false,
        message: 'No verification OTP found. Please request a new one.',
      });
    }

    // Check if OTP is expired
    if (!user.universityVerificationOtpExpiry || new Date() > user.universityVerificationOtpExpiry) {
      // Clear expired OTP
      user.universityVerificationOtp = null;
      user.universityVerificationOtpExpiry = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Verify OTP
    if (user.universityVerificationOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      });
    }

    // OTP is valid - mark as verified
    // Note: We need to get the email from the request or store it during request
    // For now, we'll require the email to be sent again or stored during request
    // Actually, we should have stored it during the request phase
    // Let's check if we have a pending email - we'll need to modify the request endpoint
    
    // For now, we'll get the email from a previous request or require it
    // But actually, we should store the email when requesting verification
    // Let me add a field to store pending email
    
    // Update: We'll get the email from the verification request
    // But we need to store it. Let me check the flow again.
    // Actually, the user should provide the email in the request, and we validate it
    // Then when verifying, we use the stored OTP and mark verified
    // But we need to know which email was verified. Let's add a pendingEmail field
    
    // Actually, simpler: we can store the email in the user document when requesting
    // But wait, we don't have that field. Let me add it to the model first.
    // Actually, let's just use universityEmail field - we'll set it when verifying
    
    // Get email from request body (optional, but we should have stored it)
    // For security, we'll require the email to match what was validated during request
    // But for simplicity, let's just mark verified and the email is already validated
    
    // Actually, we need to store the email during request. Let me update the request endpoint.
    // For now, let's assume the email was validated and stored in a temporary field
    // Or we can require email in verify request too
    
    // Simplest: Store the email during request in a temporary field, then use it during verify
    // But we don't have that field. Let's add pendingUniversityEmail field to model.
    
    // Get the pending email that was stored during request
    if (!user.pendingUniversityEmail) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification found. Please request verification again.',
      });
    }

    const verifiedEmail = user.pendingUniversityEmail;

    // Mark as verified and save email
    user.isUniversityVerified = true;
    user.universityEmail = verifiedEmail;
    user.universityVerificationOtp = null;
    user.universityVerificationOtpExpiry = null;
    user.pendingUniversityEmail = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'University email verified successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          university: user.university,
          universityEmail: user.universityEmail,
          isUniversityVerified: user.isUniversityVerified,
          skills: user.skills,
          about: user.about,
          yearOfStudy: user.yearOfStudy,
          profession: user.profession,
          profileImage: user.profileImage,
          profileComplete: !!(user.name && user.university && user.skills.length > 0 && user.about),
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Verify university email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify university email. Please try again.',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  requestUniversityVerification,
  verifyUniversityEmail,
};

