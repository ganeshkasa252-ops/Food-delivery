const ContactService = require('../services/ContactService');
const { ServiceError } = require('../services/BaseService');

class ContactController {
  constructor() {
    this.contactService = new ContactService();
  }

  /**
   * Save a contact message
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async saveContact(req, res) {
    try {
      const { name, email, phone, message } = req.body;
      
      const result = await this.contactService.saveContact({
        name,
        email,
        phone,
        message
      });

      res.status(201).json({
        success: true,
        ...result
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Get all contacts (admin endpoint)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getAllContacts(req, res) {
    try {
      const result = await this.contactService.getAllContacts();

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Get contacts by email
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getContactsByEmail(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email parameter is required.'
        });
      }

      const result = await this.contactService.getContactsByEmail(email);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      this.sendErrorResponse(res, error);
    }
  }

  /**
   * Delete a contact message
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteContact(req, res) {
    try {
      const { id } = req.params;

      const result = await this.contactService.deleteContact(id);

      res.json({
        success: true,
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

module.exports = ContactController;
