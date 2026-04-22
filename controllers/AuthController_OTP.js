const User = require('../models/User');
const EmailService = require('../services/EmailService_OTP');
const crypto = require('crypto');
require('dotenv').config();

class AuthController {
  constructor() {
    this.emailService = new EmailService();
    this.otpStore = new Map(); // In-memory OTP storage
  }

  /**
   * Generate 6-digit OTP
   */
  generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash password using SHA256
   */
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Verify password by comparing with hashed password
   */
  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  /**
   * Simple Login (Username + Password only)
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Find user
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Verify password
      const hashedPassword = this.hashPassword(password);
      if (user.passwordHash !== hashedPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Generate token
      const token = crypto.randomBytes(32).toString('hex');

      res.json({
        success: true,
        message: 'Login successful!',
        token,
        email: user.email
      });

      console.log(`✅ User login successful: ${username}`);
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  }

  /**
   * Send OTP for Registration
   */
  async sendOtp(req, res) {
    try {
      const { username, email } = req.body;

      if (!username || !email) {
        return res.status(400).json({
          success: false,
          message: 'Username and email are required'
        });
      }

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already registered'
        });
      }

      // Generate OTP
      const otp = this.generateOtp();
      const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY || 600) * 1000));

      // Store OTP in memory
      const key = `${username}:${email}`;
      this.otpStore.set(key, { otp, otpExpiry, email, username });

      // Send email
      const emailResult = await this.emailService.sendOtpEmail(email, otp, username, 'registration');

      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }

      res.json({
        success: true,
        message: `OTP sent to ${email}. It will expire in 10 minutes.`
      });

      console.log(`✅ Registration OTP sent to ${email}: ${otp}`);
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while sending OTP'
      });
    }
  }

  /**
   * Verify OTP and Register
   */
  async verifyOtp(req, res) {
    try {
      const { username, email, password, otp } = req.body;

      if (!username || !email || !password || !otp) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Get stored OTP
      const key = `${username}:${email}`;
      const storedData = this.otpStore.get(key);

      if (!storedData) {
        return res.status(400).json({
          success: false,
          message: 'Please request OTP first'
        });
      }

      // Verify OTP
      if (storedData.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      // Check OTP expiry
      if (new Date() > storedData.otpExpiry) {
        this.otpStore.delete(key);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      // Create user
      const newUser = new User({
        username,
        email,
        passwordHash: this.hashPassword(password)
      });

      await newUser.save();

      // Send welcome email
      await this.emailService.sendWelcomeEmail(email, username);

      // Clear OTP
      this.otpStore.delete(key);

      // Generate token
      const token = crypto.randomBytes(32).toString('hex');

      res.json({
        success: true,
        message: 'Registration successful!',
        token,
        user: { username, email }
      });

      console.log(`✅ User registered: ${username}`);
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  }

  /**
   * Send OTP for Password Reset
   */
  async sendPasswordResetOtp(req, res) {
    try {
      const { username, email } = req.body;

      if (!username || !email) {
        return res.status(400).json({
          success: false,
          message: 'Username and email are required'
        });
      }

      // Find user
      const user = await User.findOne({ username, email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Username or email not found'
        });
      }

      // Generate OTP
      const otp = this.generateOtp();
      const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY || 600) * 1000));

      // Store OTP in memory
      const key = `reset:${username}:${email}`;
      this.otpStore.set(key, { otp, otpExpiry, email, username });

      // Send email
      const emailResult = await this.emailService.sendOtpEmail(email, otp, username, 'password-reset');

      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP'
        });
      }

      res.json({
        success: true,
        message: `OTP sent to ${email}`
      });

      console.log(`✅ Password reset OTP sent to ${email}: ${otp}`);
    } catch (error) {
      console.error('❌ Send password reset OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  /**
   * Verify OTP for Password Reset
   */
  async verifyPasswordResetOtp(req, res) {
    try {
      const { username, email, otp } = req.body;

      if (!username || !email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Get stored OTP
      const key = `reset:${username}:${email}`;
      const storedData = this.otpStore.get(key);

      if (!storedData) {
        return res.status(400).json({
          success: false,
          message: 'Please request OTP first'
        });
      }

      // Verify OTP
      if (storedData.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      // Check OTP expiry
      if (new Date() > storedData.otpExpiry) {
        this.otpStore.delete(key);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired'
        });
      }

      res.json({
        success: true,
        message: 'OTP verified! You can now change your password.'
      });

      console.log(`✅ Password reset OTP verified for ${username}`);
    } catch (error) {
      console.error('❌ Verify password reset OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  /**
   * Change Password with OTP
   */
  async changePassword(req, res) {
    try {
      const { username, email, otp, newPassword } = req.body;

      if (!username || !email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }

      // Get stored OTP
      const key = `reset:${username}:${email}`;
      const storedData = this.otpStore.get(key);

      if (!storedData) {
        return res.status(400).json({
          success: false,
          message: 'Please verify OTP first'
        });
      }

      // Verify OTP
      if (storedData.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      // Check OTP expiry
      if (new Date() > storedData.otpExpiry) {
        this.otpStore.delete(key);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired'
        });
      }

      // Find and update user
      const user = await User.findOne({ username, email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update password
      user.passwordHash = this.hashPassword(newPassword);
      await user.save();

      // Send confirmation email
      await this.emailService.sendPasswordResetEmail(email, username);

      // Clear OTP
      this.otpStore.delete(key);

      res.json({
        success: true,
        message: 'Password changed successfully!'
      });

      console.log(`✅ Password changed for user: ${username}`);
    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while changing password'
      });
    }
  }

  /**
   * Verify current password (for authenticated users)
   * Used when user wants to change password using old password method
   */
  async verifyCurrentPassword(req, res) {
    try {
      const { currentPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify password
      const isPasswordValid = this.verifyPassword(currentPassword, user.passwordHash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      res.json({
        success: true,
        message: 'Password verified successfully'
      });

      console.log(`✅ Password verified for user: ${user.username}`);
    } catch (error) {
      console.error('❌ Verify password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while verifying password'
      });
    }
  }

  /**
   * Change password with current password verification (for authenticated users)
   * Requires authentication token and current password
   */
  async changePasswordWithCurrent(req, res) {
    try {
      const { newPassword } = req.body;
      const userId = req.user.id;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password is required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if new password is same as old password
      const isSamePassword = this.verifyPassword(newPassword, user.passwordHash);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
      }

      // Update password
      user.passwordHash = this.hashPassword(newPassword);
      await user.save();

      // Send confirmation email
      await this.emailService.sendPasswordResetEmail(user.email, user.username);

      res.json({
        success: true,
        message: 'Password changed successfully!'
      });

      console.log(`✅ Password changed with current password for user: ${user.username}`);
    } catch (error) {
      console.error('❌ Change password with current error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while changing password'
      });
    }
  }

  /**
   * Get user profile (for authenticated users)
   */
  async getProfile(req, res) {
    try {
      const userEmail = req.user.email;

      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          username: user.username,
          email: user.email,
          theme: user.theme || 'light'
        }
      });
    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching profile'
      });
    }
  }

  /**
   * Update user theme (for authenticated users)
   */
  async updateTheme(req, res) {
    try {
      const userEmail = req.user.email;
      const { theme } = req.body;

      if (!theme || !['light', 'dark'].includes(theme)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid theme value'
        });
      }

      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.theme = theme;
      await user.save();

      res.json({
        success: true,
        message: 'Theme updated successfully',
        theme: user.theme
      });

      console.log(`✅ Theme updated for user: ${user.username}`);
    } catch (error) {
      console.error('❌ Update theme error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating theme'
      });
    }
  }

  /**
   * Update user preferences (for authenticated users)
   */
  async updatePreferences(req, res) {
    try {
      const userEmail = req.user.email;
      const { orderUpdates, address } = req.body;

      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (orderUpdates !== undefined) {
        user.orderUpdates = orderUpdates;
      }
      if (address !== undefined) {
        user.address = address;
      }

      await user.save();

      res.json({
        success: true,
        message: 'Preferences updated successfully'
      });

      console.log(`✅ Preferences updated for user: ${user.username}`);
    } catch (error) {
      console.error('❌ Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating preferences'
      });
    }
  }
}

module.exports = AuthController;
