const FileStorageService = require('./FileStorageService');

/**
 * Message Logger - Unified service for logging various types of messages
 * Demonstrates: Single Responsibility Principle, Abstraction
 */
class MessageLogger {
  constructor(format = 'json') {
    this.fileStorage = new FileStorageService(format);
    this.format = format;
  }

  /**
   * Log a contact/connect with us message
   * @param {Object} contactData - Contact message data
   */
  async logContactMessage(contactData) {
    try {
      const messageData = {
        type: 'CONTACT_MESSAGE',
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone || 'N/A',
        message: contactData.message,
        status: contactData.status || 'RECEIVED'
      };

      const result = await this.fileStorage.saveMessage(messageData);
      return result;
    } catch (error) {
      console.error('Error logging contact message:', error);
      throw error;
    }
  }

  /**
   * Log an order message
   * @param {Object} orderData - Order data
   */
  async logOrderMessage(orderData) {
    try {
      const messageData = {
        type: 'ORDER_MESSAGE',
        orderId: orderData.orderId,
        customerId: orderData.customerId,
        status: orderData.status,
        details: orderData.details
      };

      const result = await this.fileStorage.saveMessage(messageData);
      return result;
    } catch (error) {
      console.error('Error logging order message:', error);
      throw error;
    }
  }

  /**
   * Log a review message
   * @param {Object} reviewData - Review data
   */
  async logReviewMessage(reviewData) {
    try {
      const messageData = {
        type: 'REVIEW_MESSAGE',
        reviewId: reviewData.reviewId,
        userId: reviewData.userId,
        rating: reviewData.rating,
        comment: reviewData.comment
      };

      const result = await this.fileStorage.saveMessage(messageData);
      return result;
    } catch (error) {
      console.error('Error logging review message:', error);
      throw error;
    }
  }

  /**
   * Log a custom message
   * @param {Object} customData - Custom message data
   */
  async logCustomMessage(customData) {
    try {
      return await this.fileStorage.saveMessage(customData);
    } catch (error) {
      console.error('Error logging custom message:', error);
      throw error;
    }
  }

  /**
   * Retrieve all logged messages
   */
  async getAllMessages() {
    try {
      return await this.fileStorage.getAllMessages();
    } catch (error) {
      console.error('Error retrieving messages:', error);
      throw error;
    }
  }

  /**
   * Retrieve messages by date (JSON format only)
   * @param {string} date - Date in format MM/DD/YYYY
   */
  async getMessagesByDate(date) {
    try {
      return await this.fileStorage.getMessagesByDate(date);
    } catch (error) {
      console.error('Error retrieving messages by date:', error);
      throw error;
    }
  }

  /**
   * Get current timestamp
   */
  getCurrentTimestamp() {
    return this.fileStorage.getCurrentTimestamp();
  }
}

module.exports = MessageLogger;
