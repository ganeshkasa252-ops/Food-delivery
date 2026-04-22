const Contact = require('../models/Contact');
const { BaseService, ServiceError } = require('./BaseService');
const MessageLogger = require('./MessageLogger');

class ContactService extends BaseService {
  constructor() {
    super();
    // Initialize MessageLogger with JSON format for structured storage
    this.messageLogger = new MessageLogger('json');
  }
  /**
   * Save a contact message
   * @param {Object} contactData - Contact data object
   * @param {string} contactData.name - Contact name
   * @param {string} contactData.email - Contact email
   * @param {string} contactData.phone - Contact phone (optional)
   * @param {string} contactData.message - Contact message
   * @returns {Object} Saved contact object
   */
  async saveContact(contactData) {
    try {
      this.validateRequiredFields(
        contactData,
        ['name', 'email', 'message']
      );

      // Create new contact document
      const contact = new Contact({
        name: contactData.name.trim(),
        email: contactData.email.toLowerCase().trim(),
        phone: contactData.phone ? contactData.phone.trim() : '',
        message: contactData.message.trim()
      });

      // Save to database
      const savedContact = await contact.save();

      // Save to file using OOP-based MessageLogger
      try {
        await this.messageLogger.logContactMessage({
          name: contactData.name.trim(),
          email: contactData.email.toLowerCase().trim(),
          phone: contactData.phone ? contactData.phone.trim() : '',
          message: contactData.message.trim(),
          databaseId: savedContact._id.toString()
        });
      } catch (fileError) {
        console.warn('Failed to log message to file:', fileError.message);
        // Don't throw - database save succeeded, just log warning
      }

      return {
        message: 'Message saved successfully.',
        contact: {
          id: savedContact._id,
          name: savedContact.name,
          email: savedContact.email,
          createdAt: savedContact.createdAt
        }
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Contact save failed');
    }
  }

  /**
   * Get all contact messages (for admin)
   * @returns {Array} List of contact messages
   */
  async getAllContacts() {
    try {
      const contacts = await Contact.find().sort({ createdAt: -1 });
      return {
        message: 'Contacts retrieved successfully.',
        count: contacts.length,
        contacts: contacts.map(contact => ({
          id: contact._id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          message: contact.message,
          createdAt: contact.createdAt
        }))
      };
    } catch (error) {
      this.handleError(error, 'Failed to retrieve contacts');
    }
  }

  /**
   * Get contacts by email
   * @param {string} email - Email to search
   * @returns {Array} List of contacts from that email
   */
  async getContactsByEmail(email) {
    try {
      this.validateRequiredFields({ email }, ['email']);

      const contacts = await Contact.find({ email: email.toLowerCase() }).sort({ createdAt: -1 });
      return {
        message: 'Contacts retrieved successfully.',
        count: contacts.length,
        contacts: contacts.map(contact => ({
          id: contact._id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          message: contact.message,
          createdAt: contact.createdAt
        }))
      };
    } catch (error) {
      this.handleError(error, 'Failed to retrieve contacts');
    }
  }

  /**
   * Delete a contact message
   * @param {string} contactId - Contact ID to delete
   * @returns {Object} Success message
   */
  async deleteContact(contactId) {
    try {
      this.validateRequiredFields({ contactId }, ['contactId']);

      const result = await Contact.findByIdAndDelete(contactId);

      if (!result) {
        throw new ServiceError('Contact not found.', 404);
      }

      return {
        message: 'Contact deleted successfully.'
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      this.handleError(error, 'Contact deletion failed');
    }
  }
}

module.exports = ContactService;
