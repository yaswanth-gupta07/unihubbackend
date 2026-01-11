const BuyerInterest = require('../models/BuyerInterest');
const Product = require('../models/Product');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * Show interest in a product
 * POST /api/products/:id/interest
 * 
 * 1) Save interest in DB
 * 2) Send email to seller
 * 
 * CAMPUS-ONLY RULE: User can only show interest in products from their own university
 */
const showInterest = async (req, res) => {
  try {
    // Check if user has completed profile
    if (!req.user.university) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (university is required)',
      });
    }

    const { message, phone } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'message is required',
      });
    }

    const product = await Product.findById(req.params.id).populate('sellerId', 'name email university isUniversityVerified');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // CAMPUS-ONLY SECURITY: Verify user can only show interest in products from their university
    if (product.universityId !== req.user.university) {
      return res.status(403).json({
        success: false,
        message: 'You can only show interest in products from your university',
      });
    }

    // Check if product is available
    if (product.status === 'SOLD') {
      return res.status(400).json({
        success: false,
        message: 'This product has already been sold',
      });
    }

    // Check if user is trying to show interest in their own product
    if (product.sellerId._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot show interest in your own product',
      });
    }

    // 1) Save interest in DB
    const buyerInterest = await BuyerInterest.create({
      productId: product._id,
      sellerId: product.sellerId._id,
      buyerId: req.user._id,
      message: message.trim(),
      phone: phone ? phone.trim() : null,
    });

    // Populate buyer info for email
    await buyerInterest.populate('buyerId', 'name email');

    // 2) Send email to seller (non-blocking - don't wait for it)
    const sellerEmail = product.sellerId.email;
    const sellerName = product.sellerId.name || 'Seller';
    const buyerName = req.user.name || req.user.email;
    const buyerEmail = req.user.email;

    const emailSubject = 'Interest in Your Product on UniHub';
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
            .header {
              background-color: #2196F3;
              color: white;
              padding: 20px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .info-section {
              background-color: #fff;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #2196F3;
            }
            .label {
              font-weight: bold;
              color: #555;
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
            <div class="header">
              <h2>Product Interest Notification</h2>
            </div>
            <p>Hello ${sellerName},</p>
            <p>Someone has shown interest in your product listing on UniHub.</p>
            
            <div class="info-section">
              <p><span class="label">Product Title:</span> ${product.title}</p>
              <p><span class="label">Price:</span> ₹${product.price}</p>
            </div>
            
            <div class="info-section">
              <p><span class="label">Buyer Name:</span> ${buyerName}</p>
              <p><span class="label">Buyer Email:</span> ${buyerEmail}</p>
              ${phone ? `<p><span class="label">Phone:</span> ${phone}</p>` : ''}
            </div>
            
            <div class="info-section">
              <p><span class="label">Message:</span></p>
              <p>${message}</p>
            </div>
            
            <p>Please contact the buyer directly using the information provided above.</p>
            
            <div class="footer">
              <p>© UniHub - Connecting University Communities</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email in background (non-blocking) - don't wait for it
    sendEmail(sellerEmail, emailSubject, emailHtml).catch((emailError) => {
      console.error('Failed to send interest email:', emailError);
      // Email failure doesn't affect the response
    });

    // Return success immediately after saving to DB
    res.status(200).json({
      success: true,
      message: 'Interest sent successfully. Seller will be notified.',
      data: { buyerInterest },
    });
  } catch (error) {
    console.error('Show interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send interest notification',
    });
  }
};

module.exports = {
  showInterest,
};

