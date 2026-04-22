const express = require('express');
const CartController = require('../controllers/CartController');
const { authMiddleware } = require('./auth');

const router = express.Router();
const cartController = new CartController();

/**
 * OOP-based Cart Routes
 * Uses Controller pattern with dependency injection
 */

// Get user's cart
router.get('/', authMiddleware.authenticate(), (req, res) => 
  cartController.getCart(req, res)
);

// Add item to cart
router.post('/add', authMiddleware.authenticate(), (req, res) => 
  cartController.addItem(req, res)
);

// Update item quantity
router.patch('/update', authMiddleware.authenticate(), (req, res) => 
  cartController.updateItem(req, res)
);

// Remove item from cart
router.post('/remove', authMiddleware.authenticate(), (req, res) => 
  cartController.removeItem(req, res)
);

// Clear cart
router.post('/clear', authMiddleware.authenticate(), (req, res) => 
  cartController.clearCart(req, res)
);

module.exports = router;
