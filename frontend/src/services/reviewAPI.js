// API service for Review CRUD operations
const API_BASE_URL = 'https://nextgen-ta95.onrender.com/api';

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
      const token = this.getAuthToken();
      console.log('Token exists:', !!token);
      console.log('Token value:', token);
      
      const headers = this.getAuthHeaders();
      console.log('Request headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: headers,
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
        // Check if token expired
        if (response.status === 401) {
          // Clear expired token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        return {
          success: false,
          error: data.error || data.message || 'Failed to create review',
          expired: response.status === 401
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

  // GET platform statistics - average rating and total reviews
  async getPlatformStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok && data.data) {
        const reviews = data.data;
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews 
          : 0;
        
        return {
          success: true,
          data: {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            totalUsers: totalReviews > 0 ? totalReviews * 10 + 500 : 1000 // Estimate user base
          }
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch stats',
          data: { averageRating: 4.8, totalReviews: 150, totalUsers: 1000 } // Fallback
        };
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return {
        success: false,
        error: error.message,
        data: { averageRating: 4.8, totalReviews: 150, totalUsers: 1000 } // Fallback
      };
    }
  }
}

// Export a singleton instance
const reviewAPI = new ReviewAPI();
export default reviewAPI;
