const User = require('../models/User');

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

module.exports = {
  getProfile,
  updateProfile,
};

