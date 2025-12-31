const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { upload, cloudinary } = require('../config/cloudinary');

/**
 * Upload image to Cloudinary
 * POST /api/upload/image
 * Requires authentication
 */
router.post('/image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    // Debug: Log the file object to see what properties are available
    console.log('Uploaded file object:', {
      path: req.file.path,
      url: req.file.url,
      secure_url: req.file.secure_url,
      public_id: req.file.public_id,
      filename: req.file.filename,
      originalname: req.file.originalname,
    });

    // Get the secure HTTPS URL from Cloudinary
    // multer-storage-cloudinary provides different URL properties
    let imageUrl = null;

    // Try different properties that multer-storage-cloudinary might provide
    if (req.file.secure_url) {
      imageUrl = req.file.secure_url;
    } else if (req.file.url) {
      imageUrl = req.file.url;
    } else if (req.file.path) {
      imageUrl = req.file.path;
    }

    // If we have a public_id but no URL, construct the secure URL
    if (!imageUrl && req.file.public_id) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      // Construct secure URL with format extension if available
      const format = req.file.format || 'jpg';
      imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${req.file.public_id}.${format}`;
    }

    // Ensure URL uses HTTPS (replace http:// with https://)
    if (imageUrl && imageUrl.startsWith('http://')) {
      imageUrl = imageUrl.replace('http://', 'https://');
    }

    // Final validation - ensure we have a valid URL
    if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
      console.error('Invalid image URL generated:', imageUrl);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate image URL',
      });
    }

    console.log('Returning image URL:', imageUrl);

    // Return Cloudinary URL
    res.status(200).json({
      success: true,
      data: {
        url: imageUrl, // Secure Cloudinary HTTPS URL
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
});

module.exports = router;

