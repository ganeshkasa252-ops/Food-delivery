const Cart = require('../models/Cart');
const { BaseService, ServiceError } = require('./BaseService');

/**
 * Cart Service Class
 * Handles all cart operations
 * Demonstrates: Inheritance, Encapsulation, Business Logic Abstraction
 */
class CartService extends BaseService {
  /**
   * Get user's cart
   * @param {string} userEmail - User email
   * @returns {Object} Cart with items
   */
  async getCart(userEmail) {
    try {
      let cart = await Cart.findOne({ userEmail });
      if (!cart) {
        cart = await Cart.create({ userEmail, items: [] });
      }
      return cart;
    } catch (error) {
      this.handleError(error, 'Failed to retrieve cart');
    }
  }

  /**
   * Add or update item in cart
   * @param {string} userEmail - User email
   * @param {Object} item - Item to add
   * @returns {Object} Updated cart
   */
  async addItem(userEmail, item) {
    try {
      this.validateRequiredFields(item, ['itemId', 'name', 'price', 'quantity']);

      let cart = await Cart.findOne({ userEmail });
      if (!cart) {
        cart = await Cart.create({ userEmail, items: [] });
      }

      const existingItemIndex = cart.items.findIndex(i => i.itemId === item.itemId);
      if (existingItemIndex > -1) {
        // Update quantity if item already exists
        cart.items[existingItemIndex].quantity += item.quantity;
      } else {
        // Add new item
        cart.items.push(item);
      }

      cart.updatedAt = new Date();
      await cart.save();
      return cart;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Failed to add item to cart');
    }
  }

  /**
   * Update item quantity in cart
   * @param {string} userEmail - User email
   * @param {string} itemId - Item ID
   * @param {number} quantity - New quantity
   * @returns {Object} Updated cart
   */
  async updateItemQuantity(userEmail, itemId, quantity) {
    try {
      if (quantity < 0) {
        throw new ServiceError('Quantity cannot be negative.', 400);
      }

      const cart = await Cart.findOne({ userEmail });
      if (!cart) {
        throw new ServiceError('Cart not found.', 404);
      }

      const item = cart.items.find(i => i.itemId === itemId);
      if (!item) {
        throw new ServiceError('Item not found in cart.', 404);
      }

      item.quantity = quantity;
      cart.updatedAt = new Date();
      await cart.save();
      return cart;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Failed to update item quantity');
    }
  }

  /**
   * Remove item from cart
   * @param {string} userEmail - User email
   * @param {string} itemId - Item ID to remove
   * @returns {Object} Updated cart
   */
  async removeItem(userEmail, itemId) {
    try {
      const cart = await Cart.findOne({ userEmail });
      if (!cart) {
        throw new ServiceError('Cart not found.', 404);
      }

      cart.items = cart.items.filter(item => item.itemId !== itemId);
      cart.updatedAt = new Date();
      await cart.save();
      return cart;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Failed to remove item from cart');
    }
  }

  /**
   * Clear entire cart
   * @param {string} userEmail - User email
   * @returns {Object} Empty cart
   */
  async clearCart(userEmail) {
    try {
      const cart = await Cart.findOneAndUpdate(
        { userEmail },
        { items: [], updatedAt: new Date() },
        { new: true }
      );
      if (!cart) {
        throw new ServiceError('Cart not found.', 404);
      }
      return cart;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Failed to clear cart');
    }
  }

  /**
   * Calculate cart total
   * @private
   * @param {Array} items - Cart items
   * @returns {number} Total amount
   */
  calculateTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}

module.exports = CartService;
