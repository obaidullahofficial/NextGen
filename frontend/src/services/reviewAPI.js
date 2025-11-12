// API service for Review CRUD operations
const API_BASE_URL = 'http://localhost:5000/api';

class ReviewAPI {
  // Get authentication token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Get authorization headers
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // GET /api/reviews - Get all reviews (admin only)
  async getAllReviews() {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || [],
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch reviews'
        };
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/reviews/:id - Get specific review
  async getReviewById(reviewId) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.review,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch review'
        };
      }
    } catch (error) {
      console.error('Error fetching review:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/plots/:plot_id/reviews - Get reviews by plot
  async getReviewsByPlot(plotId) {
    try {
      const response = await fetch(`${API_BASE_URL}/plots/${plotId}/reviews`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || [],
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch plot reviews'
        };
      }
    } catch (error) {
      console.error('Error fetching plot reviews:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // POST /api/reviews - Create new review
  async createReview(reviewData) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to create review'
        };
      }
    } catch (error) {
      console.error('Error creating review:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // PUT /api/reviews/:id - Update review
  async updateReview(reviewId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to update review'
        };
      }
    } catch (error) {
      console.error('Error updating review:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // DELETE /api/reviews/:id - Delete review
  async deleteReview(reviewId) {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to delete review'
        };
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/users/:user_email/reviews - Get reviews by user
  async getReviewsByUser(userEmail) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userEmail}/reviews`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || [],
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch user reviews'
        };
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }
}

// Export a singleton instance
const reviewAPI = new ReviewAPI();
export default reviewAPI;
