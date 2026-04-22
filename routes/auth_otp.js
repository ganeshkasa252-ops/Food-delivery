const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController_OTP');
const AuthMiddleware = require('../middleware/AuthMiddleware');

// Create controller instance
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// ======================== LOGIN ROUTES (NO OTP) ========================

/**
 * POST /api/auth/login
 * Login with username and password only
 */
router.post('/login', (req, res) => authController.login(req, res));

// ======================== REGISTRATION ROUTES (WITH OTP) ========================

/**
 * POST /api/auth/send-otp
 * Send OTP for registration
 */
router.post('/send-otp', (req, res) => authController.sendOtp(req, res));

/**
 * POST /api/auth/verify-otp
 * Verify OTP and register user
 */
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));

// ======================== PASSWORD RESET ROUTES (WITH OTP) ========================

/**
 * POST /api/auth/send-password-reset-otp
 * Send OTP for password reset
 */
router.post('/send-password-reset-otp', (req, res) =>
  authController.sendPasswordResetOtp(req, res)
);

/**
 * POST /api/auth/verify-password-reset-otp
 * Verify OTP for password reset
 */
router.post('/verify-password-reset-otp', (req, res) =>
  authController.verifyPasswordResetOtp(req, res)
);

/**
 * POST /api/auth/change-password
 * Change password with verified OTP
 */
router.post('/change-password', (req, res) => authController.changePassword(req, res));

// ======================== PASSWORD CHANGE WITH CURRENT PASSWORD (AUTHENTICATED) ========================

/**
 * POST /api/auth/verify-current-password
 * Verify current password (requires authentication)
 */
router.post('/verify-current-password', authMiddleware.authenticate(), (req, res) =>
  authController.verifyCurrentPassword(req, res)
);

/**
 * POST /api/auth/change-password-with-current
 * Change password using current password verification (requires authentication)
 */
router.post('/change-password-with-current', authMiddleware.authenticate(), (req, res) =>
  authController.changePasswordWithCurrent(req, res)
);

// ======================== PROFILE ROUTES (AUTHENTICATED) ========================

/**
 * GET /api/auth/profile
 * Get user profile (requires authentication)
 */
router.get('/profile', authMiddleware.authenticate(), (req, res) =>
  authController.getProfile(req, res)
);

/**
 * PATCH /api/auth/theme
 * Update user theme (requires authentication)
 */
router.patch('/theme', authMiddleware.authenticate(), (req, res) =>
  authController.updateTheme(req, res)
);

/**
 * POST /api/auth/update-preferences
 * Update user preferences (requires authentication)
 */
router.post('/update-preferences', authMiddleware.authenticate(), (req, res) =>
  authController.updatePreferences(req, res)
);

module.exports = router;
