const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { BaseService, ServiceError } = require('./BaseService');
const EmailService = require('./EmailService');

/**
 * User Service Class
 * Handles user authentication and profile management
 * Demonstrates: Inheritance, Encapsulation, Single Responsibility Principle
 */
class UserService extends BaseService {
  constructor() {
    super();
    this.saltRounds = 10;
    this.tokenExpiry = '7d';
    this.otpStore = {}; // In-memory OTP storage: { email: { code, timestamp } }
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Plain password
   * @returns {Object} User object and JWT token
   */
  async signup(userData) {
    try {
      this.validateRequiredFields(userData, ['username', 'email', 'password']);

      const normalizedEmail = userData.email.toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        throw new ServiceError('Email already registered. Please login.', 409);
      }

      const passwordHash = await this.hashPassword(userData.password);
      const user = await User.create({
        username: userData.username,
        email: normalizedEmail,
        passwordHash
      });

      const token = this.generateToken(user);
      return {
        user: this.formatUserData(user),
        token
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Signup failed');
    }
  }

  /**
   * Authenticate user login
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Plain password
   * @returns {Object} User object and JWT token
   */
  async login(credentials) {
    try {
      this.validateRequiredFields(credentials, ['username', 'password']);

      const user = await User.findOne({ username: credentials.username });
      if (!user) {
        throw new ServiceError('Invalid credentials.', 401);
      }

      const isPasswordValid = await this.verifyPassword(credentials.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new ServiceError('Invalid credentials.', 401);
      }

      const token = this.generateToken(user);
      return {
        user: this.formatUserData(user),
        token
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Login failed');
    }
  }

  /**
   * Retrieve user profile
   * @param {string} email - User email
   * @returns {Object} User profile data
   */
  async getProfile(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new ServiceError('User not found.', 404);
      }
      return this.formatUserData(user);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Profile retrieval failed');
    }
  }

  /**
   * Update user theme preference
   * @param {string} email - User email
   * @param {string} theme - Theme preference (light/dark)
   * @returns {Object} Updated user theme
   */
  async updateTheme(email, theme) {
    try {
      if (!['light', 'dark'].includes(theme)) {
        throw new ServiceError('Theme must be light or dark.', 400);
      }

      const user = await User.findOneAndUpdate(
        { email },
        { theme },
        { new: true }
      );

      if (!user) {
        throw new ServiceError('User not found.', 404);
      }

      return { theme: user.theme };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Theme update failed');
    }
  }

  /**
   * Hash password using bcrypt
   * @private
   * @param {string} password - Plain password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password against hash
   * @private
   * @param {string} password - Plain password
   * @param {string} hash - Password hash
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   * @private
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      { email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: this.tokenExpiry }
    );
  }

  /**
   * Format user data for response
   * @private
   * @param {Object} user - User object from database
   * @returns {Object} Formatted user data
   */
  formatUserData(user) {
    return {
      email: user.email,
      username: user.username,
      theme: user.theme,
      address: user.address || '',
      location: user.location || '',
      orderUpdates: user.orderUpdates !== false
    };
  }

  /**
   * Send OTP to user email
   * @param {Object} data - OTP request data
   * @param {string} data.username - Username
   * @param {string} data.email - Email address
   * @returns {Object} OTP send status
   */
  async sendOtp(data) {
    try {
      this.validateRequiredFields(data, ['username', 'email']);

      const normalizedEmail = data.email.toLowerCase();
      const otp = this.generateOTP();
      
      // Store OTP with timestamp
      this.otpStore[normalizedEmail] = {
        code: otp,
        username: data.username,
        timestamp: Date.now()
      };

      // Send OTP via email
      try {
        await this.emailService.sendOtpEmail(normalizedEmail, otp, data.username);
      } catch (emailError) {
        console.error('Warning: Email sending failed, but OTP is still valid:', emailError.message);
        // Don't fail the request if email fails - OTP is still stored and valid
      }

      return {
        message: `OTP sent to ${normalizedEmail}. Please check your email.`
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'OTP sending failed');
    }
  }

  /**
   * Verify OTP and register/login user
   * @param {Object} data - OTP verification data
   * @param {string} data.username - Username
   * @param {string} data.email - Email address
   * @param {string} data.password - Password
   * @param {string} data.otp - OTP code
   * @returns {Object} User object and JWT token
   */
  async verifyOtp(data) {
    try {
      this.validateRequiredFields(data, ['username', 'email', 'password', 'otp']);

      const normalizedEmail = data.email.toLowerCase();
      const storedOtpData = this.otpStore[normalizedEmail];

      // Check if OTP exists
      if (!storedOtpData) {
        throw new ServiceError('No OTP found. Please request a new one.', 400);
      }

      // Check if OTP is expired
      if (Date.now() - storedOtpData.timestamp > this.otpExpiry) {
        delete this.otpStore[normalizedEmail];
        throw new ServiceError('OTP has expired. Please request a new one.', 400);
      }

      // Verify OTP code
      if (storedOtpData.code !== data.otp) {
        throw new ServiceError('Invalid OTP. Please try again.', 400);
      }

      // Clean up used OTP
      delete this.otpStore[normalizedEmail];

      // Try to find existing user
      let user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // User exists, verify password
        const isPasswordValid = await this.verifyPassword(data.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new ServiceError('Invalid credentials.', 401);
        }
      } else {
        // Create new user
        const passwordHash = await this.hashPassword(data.password);
        user = await User.create({
          username: data.username,
          email: normalizedEmail,
          passwordHash
        });
      }

      const token = this.generateToken(user);
      return {
        user: this.formatUserData(user),
        token
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'OTP verification failed');
    }
  }

  /**
   * Generate a 6-digit OTP
   * @private
   * @returns {string} 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new ServiceError('Invalid authentication token.', 401);
    }
  }

  /**
   * Change user password
   * @param {string} email - User email
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Success message
   */
  async changePassword(email, currentPassword, newPassword) {
    try {
      this.validateRequiredFields({ email, currentPassword, newPassword }, 
        ['email', 'currentPassword', 'newPassword']);

      const user = await User.findOne({ email });
      if (!user) {
        throw new ServiceError('User not found.', 404);
      }

      // Verify current password
      const isPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new ServiceError('Current password is incorrect.', 401);
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      user.passwordHash = newPasswordHash;
      await user.save();

      return {
        message: 'Password changed successfully.'
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Password change failed');
    }
  }

  /**
   * Update user preferences (address, location, orderUpdates)
   * @param {string} email - User email
   * @param {Object} preferences - Preferences to update
   * @param {string} preferences.address - Delivery address
   * @param {string} preferences.location - Delivery location
   * @param {boolean} preferences.orderUpdates - Order update preference
   * @returns {Object} Updated preferences
   */
  async updatePreferences(email, preferences) {
    try {
      const updateData = {};

      if (preferences.address !== undefined) {
        updateData.address = preferences.address;
      }

      if (preferences.location !== undefined) {
        updateData.location = preferences.location;
      }

      if (preferences.orderUpdates !== undefined) {
        updateData.orderUpdates = preferences.orderUpdates;
      }

      const user = await User.findOneAndUpdate(
        { email },
        updateData,
        { new: true }
      );

      if (!user) {
        throw new ServiceError('User not found.', 404);
      }

      return {
        message: 'Preferences updated successfully.',
        preferences: {
          address: user.address,
          location: user.location,
          orderUpdates: user.orderUpdates
        }
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Update preferences failed');
    }
  }
}

module.exports = UserService;
