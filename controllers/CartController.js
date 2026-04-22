const CartService = require('../services/CartService');
const { ServiceError } = require('../services/BaseService');

/**
 * Cart Controller
 * Handles HTTP requests related to shopping cart operations
 * Demonstrates: Encapsulation, Request Handling, Response Management
 */
class CartController {
  constructor() {
    this.cartService = new CartService();
  }

  /**
   * Get user's cart
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getCart(req, res) {
    try {
      const cart = await this.cartService.getCart(req.user.email);
      res.json({ success: true, cart });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Add item to cart
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async addItem(req, res) {
    try {
      const { itemId, name, price, quantity } = req.body;
      const item = { itemId, name, price, quantity };
      const cart = await this.cartService.addItem(req.user.email, item);

      res.json({
        success: true,
        message: 'Item added to cart.',
        cart
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Update item quantity in cart
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateItem(req, res) {
    try {
      const { itemId, quantity } = req.body;
      const cart = await this.cartService.updateItemQuantity(
        req.user.email,
        itemId,
        quantity
      );

      res.json({
        success: true,
        message: 'Item quantity updated.',
        cart
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Remove item from cart
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async removeItem(req, res) {
    try {
      const { itemId } = req.body;
      const cart = await this.cartService.removeItem(req.user.email, itemId);

      res.json({
        success: true,
        message: 'Item removed from cart.',
        cart
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Clear entire cart
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async clearCart(req, res) {
    try {
      const cart = await this.cartService.clearCart(req.user.email);

      res.json({
        success: true,
        message: 'Cart cleared.',
        cart
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Send error response in standardized format
   * @private
   * @param {Object} res - Express response
   * @param {Error} error - Error object
   */
  sendErrorResponse(res, error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred.'
      });
    }
  }
}

module.exports = CartController;
