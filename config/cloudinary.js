const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'unimarket', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Resize images
  },
});

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Log file info for debugging
    console.log('File upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
    });

    // Accept only image files
    // Check mimetype first
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    // Fallback: Check file extension if mimetype is missing or incorrect
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const fileExtension = file.originalname
      ? file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))
      : '';

    if (allowedExtensions.includes(fileExtension)) {
      console.log('File accepted by extension:', fileExtension);
      cb(null, true);
      return;
    }

    // If mimetype is missing, be more lenient (some clients don't send it correctly)
    if (!file.mimetype) {
      console.warn('Warning: No mimetype provided for file:', file.originalname);
      // Accept if it looks like an image file by name
      if (file.originalname && allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
        console.log('File accepted despite missing mimetype (extension check passed)');
        cb(null, true);
        return;
      }
    }

    console.error('File rejected:', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      extension: fileExtension,
    });
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp, gif)'), false);
  },
});

module.exports = { cloudinary, upload };

