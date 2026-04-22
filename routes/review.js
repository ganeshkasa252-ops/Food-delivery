const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');

const reviewController = new ReviewController();

// Create a new review
router.post('/', (req, res) => reviewController.createReview(req, res));

// Get all reviews
router.get('/', (req, res) => reviewController.getReviews(req, res));

// Get reviews for a specific food item
router.get('/item/:foodItem', (req, res) => reviewController.getReviewsByFoodItem(req, res));

module.exports = router;
