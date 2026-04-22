const Review = require('../models/Review');

class ReviewController {
  async createReview(req, res) {
    try {
      const { username, userEmail, rating, comment, foodItem } = req.body;

      if (!username || !userEmail || !rating || !comment) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
      }

      const review = new Review({
        username,
        userEmail,
        rating,
        comment,
        foodItem
      });

      await review.save();
      res.status(201).json({ success: true, message: 'Review added successfully', review });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getReviews(req, res) {
    try {
      const reviews = await Review.find().sort({ createdAt: -1 }).limit(20);
      res.json({ success: true, reviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getReviewsByFoodItem(req, res) {
    try {
      const { foodItem } = req.params;
      const reviews = await Review.find({ foodItem }).sort({ createdAt: -1 }).limit(10);
      res.json({ success: true, reviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = ReviewController;
