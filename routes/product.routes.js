const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  createProduct,
  getProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  reserveProduct,
  markProductSold,
} = require('../controllers/product.controller');
const { showInterest } = require('../controllers/buyerInterest.controller');

// All product routes require authentication
router.use(authenticate);

router.post('/', createProduct);
router.get('/', getProducts);
router.get('/my', getMyProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct); // Edit product
router.put('/:id/reserve', reserveProduct);
router.put('/:id/sold', markProductSold);
router.post('/:id/interest', showInterest);

module.exports = router;

