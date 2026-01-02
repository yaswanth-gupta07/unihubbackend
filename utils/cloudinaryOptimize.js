/**
 * Optimize Cloudinary image URLs for faster loading
 * Adds transformations: w_600 (width), q_auto (quality), f_auto (format)
 * 
 * @param {string} url - Original Cloudinary URL
 * @returns {string} - Optimized Cloudinary URL
 */
function optimizeCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // Check if it's already a Cloudinary URL
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  // Check if transformations already exist (avoid double transformation)
  if (url.includes('/w_') || url.includes('/c_') || url.includes('/h_')) {
    // URL already has transformations, return as-is to avoid double transformation
    return url;
  }

  // Insert transformation after /upload/
  // Handle both /upload/ and /upload/v\d+/ patterns
  if (url.includes('/upload/v')) {
    // Has version: https://res.cloudinary.com/xxx/image/upload/v1234567/xxx.jpg
    return url.replace('/upload/v', '/upload/w_600,q_auto,f_auto/v');
  } else {
    // No version: https://res.cloudinary.com/xxx/image/upload/xxx.jpg
    return url.replace('/upload/', '/upload/w_600,q_auto,f_auto/');
  }
}

/**
 * Optimize an array of Cloudinary URLs
 * @param {string[]} urls - Array of Cloudinary URLs
 * @returns {string[]} - Array of optimized URLs
 */
function optimizeCloudinaryUrls(urls) {
  if (!Array.isArray(urls)) {
    return urls;
  }
  return urls.map(url => optimizeCloudinaryUrl(url));
}

module.exports = {
  optimizeCloudinaryUrl,
  optimizeCloudinaryUrls,
};

