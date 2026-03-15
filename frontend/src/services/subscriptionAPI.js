// Frontend API service for Subscription and Subscription Plans
const API_BASE_URL = '$API_URL';

class SubscriptionAPI {
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

  // ===== SUBSCRIPTION PLANS =====

  // GET /api/plans - Get all subscription plans
  async getAllPlans(status = null) {
    try {
      const url = status 
        ? `${API_BASE_URL}/plans?status=${status}`
        : `${API_BASE_URL}/plans`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || []
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch subscription plans'
        };
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/plans/:id - Get specific plan
  async getPlanById(planId) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch subscription plan'
        };
      }
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // POST /api/plans - Create subscription plan (Admin only)
  async createPlan(planData) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(planData)
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
          error: data.error || 'Failed to create subscription plan'
        };
      }
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // PUT /api/plans/:id - Update subscription plan (Admin only)
  async updatePlan(planId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
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
          error: data.error || 'Failed to update subscription plan'
        };
      }
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // DELETE /api/plans/:id - Delete subscription plan (Admin only)
  async deletePlan(planId) {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
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
          error: data.error || 'Failed to delete subscription plan'
        };
      }
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // ===== SUBSCRIPTIONS =====

  // POST /api/subscribe/:plan_id - Subscribe to a plan
  async subscribeToPlan(planId) {
    try {
      const response = await fetch(`${API_BASE_URL}/subscribe/${planId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
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
          error: data.error || 'Failed to subscribe to plan'
        };
      }
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/my-subscription - Get current user's subscription
  async getMySubscription() {
    try {
      const response = await fetch(`${API_BASE_URL}/my-subscription`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch subscription'
        };
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/subscriptions - Get all subscriptions (Admin only)
  async getAllSubscriptions(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const url = queryParams.toString()
        ? `${API_BASE_URL}/subscriptions?${queryParams}`
        : `${API_BASE_URL}/subscriptions`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || []
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch subscriptions'
        };
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // POST /api/subscriptions/:id/cancel - Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
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
          error: data.error || 'Failed to cancel subscription'
        };
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/subscriptions/stats - Get subscription statistics (Admin only)
  async getSubscriptionStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch subscription statistics'
        };
      }
    } catch (error) {
      console.error('Error fetching subscription statistics:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }
}

// Export singleton instance
const subscriptionAPI = new SubscriptionAPI();
export default subscriptionAPI;
