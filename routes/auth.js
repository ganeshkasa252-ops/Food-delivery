const express = require('express');
const AuthController = require('../controllers/AuthController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();
const authController = new AuthController();
const authMiddlewareInstance = new AuthMiddleware();

/**
 * OOP-based Authentication Routes
 * Uses Controller pattern with dependency injection
 */

// OTP endpoints
router.post('/send-otp', (req, res) => authController.sendOtp(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));

// Signup endpoint
router.post('/signup', (req, res) => authController.signup(req, res));

// Login endpoint
router.post('/login', (req, res) => authController.login(req, res));

// Get user profile (requires authentication)
router.get('/profile', authMiddlewareInstance.authenticate(), (req, res) => 
  authController.getProfile(req, res)
);

// Update user theme (requires authentication)
router.patch('/theme', authMiddlewareInstance.authenticate(), (req, res) => 
  authController.updateTheme(req, res)
);

// Change password (requires authentication)
router.post('/change-password', authMiddlewareInstance.authenticate(), (req, res) => 
  authController.changePassword(req, res)
);

// Update preferences (requires authentication)
router.post('/update-preferences', authMiddlewareInstance.authenticate(), (req, res) => 
  authController.updatePreferences(req, res)
);

// Export both router and middleware instance for use in other route files
module.exports = { router, authMiddleware: authMiddlewareInstance };
