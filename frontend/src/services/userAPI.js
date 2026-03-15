import { authenticatedRequest, apiRequest } from './baseApiService';

class UserAPI {
  constructor() {
    this.baseUrl = '';
  }

  // Get all users
  async getAllUsers() {
    try {
      const response = await authenticatedRequest(`${this.baseUrl}/users`, {}, 'getAllUsers');
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch users',
        data: []
      };
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await authenticatedRequest(`${this.baseUrl}/users/stats`, {}, 'getUserStats');
      return {
        success: true,
        data: response.data || {}
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user statistics',
        data: {
          total_users: 0,
          active_users: 0,
          new_users_this_month: 0,
          user_growth_rate: 0
        }
      };
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await authenticatedRequest(`${this.baseUrl}/users/${userId}`, {}, 'getUserById');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user'
      };
    }
  }

  // Update user status
  async updateUserStatus(userId, status) {
    try {
      const response = await authenticatedRequest(`${this.baseUrl}/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }, 'updateUserStatus');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating user status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update user status'
      };
    }
  }

  // Get user activity
  async getUserActivity(userId) {
    try {
      const response = await authenticatedRequest(`${this.baseUrl}/users/${userId}/activity`, {}, 'getUserActivity');
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user activity',
        data: []
      };
    }
  }

  // Get user analytics for dashboard
  async getUserAnalytics(dateRange = '7days') {
    try {
      const response = await authenticatedRequest(`${this.baseUrl}/analytics?range=${dateRange}`, {}, 'getUserAnalytics');
      return {
        success: true,
        data: response.data || {}
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user analytics',
        data: {
          registrations_over_time: [],
          user_types: [],
          activity_metrics: {}
        }
      };
    }
  }
}

const userAPI = new UserAPI();
export default userAPI;
