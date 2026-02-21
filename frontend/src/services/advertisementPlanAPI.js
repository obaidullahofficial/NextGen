// Advertisement Plan API Service
const API_BASE_URL = 'http://localhost:5000/api';

class AdvertisementPlanAPI {
  getAuthToken() {
    return localStorage.getItem('token');
  }

  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // ===== PLAN OPERATIONS =====

  // Get all plans (public can view active plans)
  async getAllPlans(activeOnly = false) {
    try {
      const params = activeOnly ? '?active_only=true' : '';
      const response = await fetch(`${API_BASE_URL}/advertisement-plans${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      return { success: false, error: error.message };
    }
  }

  // Get plan by ID
  async getPlanById(planId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisement-plans/${planId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching plan:', error);
      return { success: false, error: error.message };
    }
  }

  // Create plan (admin only)
  async createPlan(planData) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisement-plans`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(planData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating plan:', error);
      return { success: false, error: error.message };
    }
  }

  // Update plan (admin only)
  async updatePlan(planId, planData) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisement-plans/${planId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(planData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating plan:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete plan (admin only)
  async deletePlan(planId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisement-plans/${planId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting plan:', error);
      return { success: false, error: error.message };
    }
  }

  // Toggle plan active status (admin only)
  async togglePlanStatus(planId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisement-plans/${planId}/toggle-status`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error toggling plan status:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AdvertisementPlanAPI();
