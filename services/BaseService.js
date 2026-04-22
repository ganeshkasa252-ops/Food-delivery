/**
 * Abstract Base Service Class
 * Provides common functionality for all services
 * Demonstrates: Encapsulation, Inheritance, Abstraction
 */
class BaseService {
  constructor() {
    if (new.target === BaseService) {
      throw new TypeError('BaseService is an abstract class and cannot be instantiated directly.');
    }
  }

  /**
   * Handle errors consistently across all services
   * @param {Error} error - The error to handle
   * @param {string} context - Context of where error occurred
   * @throws {ServiceError}
   */
  handleError(error, context) {
    const message = error.message || 'An unexpected error occurred';
    const statusCode = error.statusCode || 500;
    const errorDetails = {
      message: `${context}: ${message}`,
      statusCode,
      timestamp: new Date().toISOString()
    };
    throw new ServiceError(errorDetails.message, statusCode);
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array<string>} requiredFields - Fields that must be present
   * @throws {ServiceError}
   */
  validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      throw new ServiceError(`Missing required fields: ${missingFields.join(', ')}`, 400);
    }
  }
}

/**
 * Custom Service Error Class
 * Demonstrates: Encapsulation, Custom Exception Handling
 */
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

module.exports = { BaseService, ServiceError };
