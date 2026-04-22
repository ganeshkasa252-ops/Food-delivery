class ReviewService {
  async createReview(reviewData) {
    try {
      const response = await fetch('http://localhost:5000/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  async getReviews() {
    try {
      const response = await fetch('http://localhost:5000/api/review');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  async getReviewsByFood(foodItem) {
    try {
      const response = await fetch(`http://localhost:5000/api/review/item/${foodItem}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching food reviews:', error);
      throw error;
    }
  }
}

const reviewService = new ReviewService();

// Load reviews on page load
async function loadReviews() {
  // Check if user is logged in
  if (!getAuthToken()) {
    const reviewsSection = document.getElementById('reviews');
    const reviewsList = document.getElementById('reviewsList');
    
    if (reviewsSection) {
      reviewsSection.style.display = 'none';
    }
    if (reviewsList) {
      reviewsList.innerHTML = '<p class="status-message">Please login to view reviews.</p>';
    }
    return;
  }

  try {
    const result = await reviewService.getReviews();
    
    if (result.success && result.reviews) {
      displayReviews(result.reviews);
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
    document.getElementById('reviewsList').innerHTML = '<p class="status-message">Failed to load reviews</p>';
  }
}

function displayReviews(reviews) {
  const reviewsList = document.getElementById('reviewsList');
  
  if (!reviews || reviews.length === 0) {
    reviewsList.innerHTML = '<p class="status-message">No reviews yet. Be the first to review!</p>';
    return;
  }

  reviewsList.innerHTML = reviews.map(review => `
    <div class="review-card">
      <div class="review-header">
        <h4 class="review-name">${escapeHtml(review.username)}</h4>
        <div class="review-rating">
          ${getStarRating(review.rating)}
        </div>
      </div>
      <p class="review-comment">${escapeHtml(review.comment)}</p>
      <span class="review-date">${formatDate(review.createdAt)}</span>
    </div>
  `).join('');
}

function getStarRating(rating) {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 168) {
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle review form submission
document.addEventListener('DOMContentLoaded', function() {
  const reviewForm = document.getElementById('reviewForm');
  const reviewMessage = document.getElementById('reviewMessage');

  if (reviewForm) {
    // Check if user is logged in
    if (!getAuthToken()) {
      reviewForm.style.display = 'none';
      if (reviewMessage) {
        reviewMessage.textContent = 'Please login to submit a review';
        reviewMessage.style.color = '#3498db';
        reviewMessage.style.display = 'block';
      }
    } else {
      reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('reviewName').value.trim();
        const email = document.getElementById('reviewEmail').value.trim();
        const rating = parseInt(document.getElementById('reviewRating').value);
        const comment = document.getElementById('reviewComment').value.trim();

        if (!name || !email || !rating || !comment) {
          reviewMessage.textContent = 'Please fill in all required fields';
          reviewMessage.style.color = '#e74c3c';
          return;
        }

        try {
          reviewMessage.textContent = 'Submitting your review...';
          reviewMessage.style.color = '#3498db';

          const result = await reviewService.createReview({
            username: name,
            userEmail: email,
            rating: rating,
            comment: comment
          });

          if (result.success) {
            reviewMessage.textContent = 'Review submitted successfully! Thank you for your feedback.';
            reviewMessage.style.color = '#27ae60';
            
            // Clear form
            reviewForm.reset();
            
            // Reload reviews
            setTimeout(() => {
              loadReviews();
              reviewMessage.textContent = '';
            }, 2000);
          } else {
            throw new Error(result.error || 'Failed to submit review');
          }
        } catch (error) {
          console.error('Error submitting review:', error);
          reviewMessage.textContent = error.message || 'Error submitting review. Please try again.';
          reviewMessage.style.color = '#e74c3c';
        }
      });
    }
  }

  // Load reviews on page load
  loadReviews();
});
