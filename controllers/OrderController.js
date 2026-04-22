const OrderService = require('../services/OrderService');
const CartService = require('../services/CartService');
const { ServiceError } = require('../services/BaseService');

/**
 * Order Controller
 * Handles HTTP requests related to order management
 * Demonstrates: Encapsulation, Dependency Injection, Complex Business Logic
 */
class OrderController {
  constructor() {
    this.orderService = new OrderService();
    this.cartService = new CartService();
  }

  /**
   * Create a new order
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createOrder(req, res) {
    try {
      const { items, address, paymentMethod } = req.body;
      
      const order = await this.orderService.createOrder(
        req.user.email,
        req.user.username,
        { items, address, paymentMethod }
      );

      // Clear cart after order is created
      await this.cartService.clearCart(req.user.email);

      res.json({
        success: true,
        message: 'Order created successfully.',
        order
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Get user's orders
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getUserOrders(req, res) {
    try {
      const orders = await this.orderService.getOrdersByUser(req.user.email);
      res.json({ success: true, orders });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Get single order details
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      const order = await this.orderService.getOrderById(orderId);
      res.json({ success: true, order });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Update order status (admin)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateOrderStatus(req, res) {
    try {
      const { orderId, status } = req.body;
      const order = await this.orderService.updateOrderStatus(orderId, status);

      res.json({
        success: true,
        message: 'Order status updated.',
        order
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Update payment details after Razorpay payment
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updatePaymentDetails(req, res) {
    try {
      const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      
      const order = await this.orderService.updatePaymentDetails(
        orderId,
        { razorpayOrderId, razorpayPaymentId, razorpaySignature }
      );

      res.json({
        success: true,
        message: 'Payment confirmed.',
        order
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Get all orders (admin)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getAllOrders(req, res) {
    try {
      const orders = await this.orderService.getAllOrders();
      res.json({ success: true, orders });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Get order statistics (admin)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getOrderStats(req, res) {
    try {
      const stats = await this.orderService.getOrderStats();
      res.json({ success: true, stats });
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

module.exports = OrderController;
