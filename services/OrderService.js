const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { BaseService, ServiceError } = require('./BaseService');

/**
 * Order Service Class
 * Manages order creation, tracking, and status updates
 * Demonstrates: Inheritance, Encapsulation, State Management
 */
class OrderService extends BaseService {
  /**
   * Create a new order from cart
   * @param {string} userEmail - User email
   * @param {string} username - Username
   * @param {Object} orderData - Order details
   * @returns {Object} Created order
   */
  async createOrder(userEmail, username, orderData) {
    try {
      this.validateRequiredFields(orderData, ['items', 'address', 'paymentMethod']);

      if (orderData.items.length === 0) {
        throw new ServiceError('Cannot create order with empty cart.', 400);
      }

      if (!['UPI', 'Card', 'COD'].includes(orderData.paymentMethod)) {
        throw new ServiceError('Invalid payment method.', 400);
      }

      const total = this.calculateOrderTotal(orderData.items);
      
      const order = await Order.create({
        userEmail,
        username,
        items: orderData.items,
        total,
        address: orderData.address,
        paymentMethod: orderData.paymentMethod,
        status: 'placed'
      });

      return order;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Failed to create order');
    }
  }

  /**
   * Get orders by user email
   * @param {string} userEmail - User email
   * @returns {Array} User's orders
   */
  async getOrdersByUser(userEmail) {
    try {
      const orders = await Order.find({ userEmail }).sort({ createdAt: -1 });
      return orders;
    } catch (error) {
      this.handleError(error, 'Failed to retrieve user orders');
    }
  }

  /**
   * Get single order by ID
   * @param {string} orderId - Order ID
   * @returns {Object} Order details
   */
  async getOrderById(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new ServiceError('Order not found.', 404);
      }
      return order;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Failed to retrieve order');
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @returns {Object} Updated order
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      const validStatuses = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'failed'];
      if (!validStatuses.includes(newStatus)) {
        throw new ServiceError('Invalid order status.', 400);
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: newStatus },
        { new: true }
      );

      if (!order) {
        throw new ServiceError('Order not found.', 404);
      }

      return order;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Failed to update order status');
    }
  }

  /**
   * Update order with Razorpay payment details
   * @param {string} orderId - Order ID
   * @param {Object} paymentData - Razorpay payment data
   * @returns {Object} Updated order
   */
  async updatePaymentDetails(orderId, paymentData) {
    try {
      this.validateRequiredFields(paymentData, ['razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature']);

      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          razorpayOrderId: paymentData.razorpayOrderId,
          razorpayPaymentId: paymentData.razorpayPaymentId,
          razorpaySignature: paymentData.razorpaySignature,
          status: 'confirmed'
        },
        { new: true }
      );

      if (!order) {
        throw new ServiceError('Order not found.', 404);
      }

      return order;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Failed to update payment details');
    }
  }

  /**
   * Calculate total amount for order items
   * @private
   * @param {Array} items - Order items
   * @returns {number} Total amount
   */
  calculateOrderTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * Get all orders (admin)
   * @returns {Array} All orders
   */
  async getAllOrders() {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      return orders;
    } catch (error) {
      this.handleError(error, 'Failed to retrieve all orders');
    }
  }

  /**
   * Get order statistics (admin)
   * @returns {Object} Order statistics
   */
  async getOrderStats() {
    try {
      const totalOrders = await Order.countDocuments();
      const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
      const totalRevenue = await Order.aggregate([
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      return {
        totalOrders,
        deliveredOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders: totalOrders - deliveredOrders
      };
    } catch (error) {
      this.handleError(error, 'Failed to retrieve order statistics');
    }
  }
}

module.exports = OrderService;
