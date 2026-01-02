const Product = require('../models/Product');
const BuyerInterest = require('../models/BuyerInterest');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * Create a new product
 * POST /api/products
 * Backend assigns: sellerId, universityId, status
 */
const createProduct = async (req, res) => {
  try {
    const { title, price, category, description, condition, images } = req.body;

    // Validate required fields
    if (!title || !price || !category || !description || !condition) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: title, price, category, description, condition',
      });
    }

    // Validate condition
    if (!['New', 'Good', 'Used'].includes(condition)) {
      return res.status(400).json({
        success: false,
        message: 'Condition must be one of: New, Good, Used',
      });
    }

    // Check if user has completed profile (university is required)
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required) before listing products',
      });
    }

    // SECURITY: Do NOT accept universityId from request body
    // Backend assigns it automatically from user.university
    const universityId = req.user.university;

    // Create product
    const product = await Product.create({
      title: title.trim(),
      price: parseFloat(price),
      category: category.trim(),
      description: description.trim(),
      condition: condition.trim(),
      images: Array.isArray(images) ? images : [], // Cloudinary URLs only
      sellerId: req.user._id, // Backend assigns automatically
      universityId: universityId, // Backend assigns automatically
      status: 'AVAILABLE', // Backend assigns automatically
    });

    // Populate sellerId field
    await product.populate('sellerId', 'name email university');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
};

/**
 * Get products feed (marketplace home screen)
 * GET /api/products?category=Electronics&search=laptop
 * 
 * Filter rules:
 * - universityId == user.universityId
 * - sellerId != user._id (exclude own products)
 * - Show AVAILABLE, RESERVED, and SOLD products (SOLD shown with indicator)
 * - sorted by newest first
 */
const getProducts = async (req, res) => {
  try {
    // Check if user has completed profile
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required)',
      });
    }

    const { category, search } = req.query;
    const universityId = req.user.university;

    // Build query filter
    const filter = {
      universityId: universityId, // Same university only
      sellerId: { $ne: req.user._id }, // Exclude own products
      // Show all statuses (AVAILABLE, RESERVED, SOLD) - SOLD will be marked in UI
    };

    // Category filter
    if (category && category.trim() !== '') {
      filter.category = category.trim();
    }

    // Search filter (title + description)
    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Limit results to improve performance (pagination can be added later)
    const products = await Product.find(filter)
      .populate('sellerId', 'name email university')
      .sort({ createdAt: -1 }) // Newest first
      .limit(50); // Limit to 50 most recent products for better performance

    res.status(200).json({
      success: true,
      data: { products, count: products.length },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
};

/**
 * Get single product by ID
 * GET /api/products/:id
 * CAMPUS-ONLY RULE: User can only access products from their own university
 */
const getProductById = async (req, res) => {
  try {
    // Check if user has completed profile
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required)',
      });
    }

    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'name email university');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // CAMPUS-ONLY SECURITY: Verify user can only access products from their university
    if (product.universityId !== req.user.university) {
      return res.status(403).json({
        success: false,
        message: 'You can only access products from your university',
      });
    }

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
};

/**
 * Get products listed by current user (Seller Dashboard)
 * GET /api/products/my
 * 
 * Returns products grouped as:
 * - ACTIVE: AVAILABLE + RESERVED
 * - SOLD: SOLD
 * 
 * For each product, includes interested buyers list
 */
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user._id })
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });

    // Get interested buyers for all products
    const productIds = products.map(p => p._id);
    const interests = await BuyerInterest.find({ productId: { $in: productIds } })
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 });

    // Group interests by productId
    const interestsByProduct = {};
    interests.forEach(interest => {
      const productId = interest.productId.toString();
      if (!interestsByProduct[productId]) {
        interestsByProduct[productId] = [];
      }
      interestsByProduct[productId].push({
        _id: interest._id,
        buyerId: interest.buyerId,
        buyerName: interest.buyerId.name || interest.buyerId.email,
        buyerEmail: interest.buyerId.email,
        phone: interest.phone,
        message: interest.message,
        createdAt: interest.createdAt,
      });
    });

    // Add interests to products
    const productsWithInterests = products.map(product => {
      const productObj = product.toObject();
      productObj.interestedBuyers = interestsByProduct[product._id.toString()] || [];
      return productObj;
    });

    // Group products by status
    const active = productsWithInterests.filter(p => 
      p.status === 'AVAILABLE' || p.status === 'RESERVED'
    );
    const sold = productsWithInterests.filter(p => p.status === 'SOLD');

    res.status(200).json({
      success: true,
      data: {
        active,
        sold,
        count: {
          active: active.length,
          sold: sold.length,
          total: products.length,
        },
      },
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your products',
    });
  }
};

/**
 * Update product (Edit)
 * PUT /api/products/:id
 * 
 * Seller can edit: title, description, price, category, condition, images
 * MUST NOT change: sellerId, universityId, createdAt
 */
const updateProduct = async (req, res) => {
  try {
    const { title, description, price, category, condition, images } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // SECURITY: Only seller can edit their own product
    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own products',
      });
    }

    // Update allowed fields only
    if (title !== undefined) product.title = title.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = parseFloat(price);
    if (category !== undefined) product.category = category.trim();
    if (condition !== undefined) {
      if (!['New', 'Good', 'Used'].includes(condition)) {
        return res.status(400).json({
          success: false,
          message: 'Condition must be one of: New, Good, Used',
        });
      }
      product.condition = condition.trim();
    }
    if (images !== undefined) {
      product.images = Array.isArray(images) ? images : [];
    }

    // sellerId, universityId, createdAt are NOT changed

    await product.save();
    await product.populate('sellerId', 'name email university');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
    });
  }
};

/**
 * Reserve a product
 * PUT /api/products/:id/reserve
 * CAMPUS-ONLY RULE: User can only reserve products from their own university
 */
const reserveProduct = async (req, res) => {
  try {
    // Check if user has completed profile
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required)',
      });
    }

    const product = await Product.findById(req.params.id).populate('sellerId', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // CAMPUS-ONLY SECURITY: Verify user can only reserve products from their university
    if (product.universityId !== req.user.university) {
      return res.status(403).json({
        success: false,
        message: 'You can only reserve products from your university',
      });
    }

    // Check if product is available
    if (product.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Product is not available. Current status: ${product.status}`,
      });
    }

    // Check if user is trying to reserve their own product
    if (product.sellerId._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot reserve your own product',
      });
    }

    // Update product status
    product.status = 'RESERVED';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product reserved successfully',
      data: { product },
    });
  } catch (error) {
    console.error('Reserve product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reserve product',
    });
  }
};

/**
 * Mark product as sold
 * PUT /api/products/:id/sold
 */
const markProductSold = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('sellerId', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if user is the seller
    if (product.sellerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the seller can mark product as sold',
      });
    }

    // Check if product is already SOLD
    if (product.status === 'SOLD') {
      return res.status(400).json({
        success: false,
        message: 'Product already marked as sold',
      });
    }

    // Update product status
    product.status = 'SOLD';
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product marked as sold',
      data: { product },
    });
  } catch (error) {
    console.error('Mark product sold error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark product as sold',
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  reserveProduct,
  markProductSold,
};
