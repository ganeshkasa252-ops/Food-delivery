const express = require('express');
const ContactController = require('../controllers/ContactController');
const { authMiddleware } = require('./auth');

const router = express.Router();
const contactController = new ContactController();

/**
 * POST /api/contact
 * Save a contact message
 * Public endpoint
 */
router.post('/', async (req, res) => {
  await contactController.saveContact(req, res);
});

/**
 * GET /api/contact
 * Get all contacts (admin endpoint)
 * Protected - requires authentication
 */
router.get('/', authMiddleware.authenticate(), async (req, res) => {
  await contactController.getAllContacts(req, res);
});

/**
 * GET /api/contact/search
 * Get contacts by email
 * Protected - requires authentication
 */
router.get('/search', authMiddleware.authenticate(), async (req, res) => {
  await contactController.getContactsByEmail(req, res);
});

/**
 * DELETE /api/contact/:id
 * Delete a contact message
 * Protected - requires authentication
 */
router.delete('/:id', authMiddleware.authenticate(), async (req, res) => {
  await contactController.deleteContact(req, res);
});

module.exports = router;
