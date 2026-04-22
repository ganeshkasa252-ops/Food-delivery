const UserService = require('../services/UserService');
const { ServiceError } = require('../services/BaseService');

/**
 * Authentication Middleware Class
 * Handles JWT token verification and user authentication
 * Demonstrates: Encapsulation, Middleware Pattern, Authentication Logic
 */
class AuthMiddleware {
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Verify JWT token and extract user information
   * Returns Express middleware function
   */
  authenticate() {
    return (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            message: 'Authentication token missing.'
          });
        }

        const token = authHeader.split(' ')[1];
        const payload = this.userService.verifyToken(token);
        req.user = payload;
        next();
      } catch (error) {
        if (error instanceof ServiceError) {
          res.status(error.statusCode).json({
            success: false,
            message: error.message
          });
        } else {
          res.status(401).json({
            success: false,
            message: 'Invalid authentication token.'
          });
        }
      }
    };
  }
}

module.exports = AuthMiddleware;
