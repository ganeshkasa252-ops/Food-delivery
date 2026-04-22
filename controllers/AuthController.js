const UserService = require('../services/UserService');
const { ServiceError } = require('../services/BaseService');

/**
 * Authentication Controller
 * Handles HTTP requests related to user authentication
 * Demonstrates: Encapsulation, Dependency Injection, Request/Response Handling
 */
class AuthController {
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Handle signup request
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async signup(req, res) {
    try {
      const { username, email, password } = req.body;
      const result = await this.userService.signup({ username, email, password });
      
      res.json({
        success: true,
        message: 'Signup successful.',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Handle login request
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await this.userService.login({ username, password });

      res.json({
        success: true,
        message: 'Login successful.',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Get user profile
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getProfile(req, res) {
    try {
      const user = await this.userService.getProfile(req.user.email);
      res.json({ success: true, user });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Update user theme
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateTheme(req, res) {
    try {
      const { theme } = req.body;
      const result = await this.userService.updateTheme(req.user.email, theme);
      res.json({ success: true, ...result });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Send OTP to email
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async sendOtp(req, res) {
    try {
      const { username, email } = req.body;
      const result = await this.userService.sendOtp({ username, email });
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Verify OTP and complete signup/login
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async verifyOtp(req, res) {
    try {
      const { username, email, password, otp } = req.body;
      const result = await this.userService.verifyOtp({ username, email, password, otp });
      
      res.json({
        success: true,
        message: 'OTP verified successfully.',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await this.userService.changePassword(
        req.user.email,
        currentPassword,
        newPassword
      );
      
      res.json({
        success: true,
        message: 'Password changed successfully.',
        ...result
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Update user preferences (address, location, orderUpdates)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updatePreferences(req, res) {
    try {
      const { address, location, orderUpdates } = req.body;
      const result = await this.userService.updatePreferences(
        req.user.email,
        { address, location, orderUpdates }
      );
      
      res.json({
        success: true,
        message: 'Preferences updated successfully.',
        ...result
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

module.exports = AuthController;
