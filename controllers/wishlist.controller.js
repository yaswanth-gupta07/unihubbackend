const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

/**
 * Get user's wishlist
 * GET /api/wishlist
 */
const getWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ userId: req.user._id })
      .populate('productId')
      .sort({ createdAt: -1 });

    // Filter out any products that might have been deleted
    const validItems = wishlistItems
      .filter(item => item.productId != null)
      .map(item => item.productId);

    res.status(200).json({
      success: true,
      data: {
        wishlist: validItems,
        count: validItems.length,
      },
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
    });
  }
};

/**
 * Add product to wishlist
 * POST /api/wishlist
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required',
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
      userId: req.user._id,
      productId: productId,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Product already in wishlist',
        data: { product },
      });
    }

    // Add to wishlist
    await Wishlist.create({
      userId: req.user._id,
      productId: productId,
    });

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: { product },
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(200).json({
        success: true,
        message: 'Product already in wishlist',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
    });
  }
};

/**
 * Remove product from wishlist
 * DELETE /api/wishlist/:productId
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Wishlist.findOneAndDelete({
      userId: req.user._id,
      productId: productId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};

