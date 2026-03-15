// Advertisement API Service - Simplified Plan-Based System
const API_BASE_URL = '$API_URL';

class AdvertisementAPI {
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

  // ===== ADVERTISEMENT OPERATIONS =====

  // Create new advertisement
  async createAdvertisement(adData) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(adData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating advertisement:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all advertisements (user sees only their ads, admin sees all)
  async getAllAdvertisements(page = 1, perPage = 10, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...filters
      });

      const response = await fetch(`${API_BASE_URL}/advertisements?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      return { success: false, error: error.message };
    }
  }

  // Get advertisement by ID
  async getAdvertisementById(adId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${adId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      return { success: false, error: error.message };
    }
  }

  // Get pending advertisements (admin only)
  async getPendingAdvertisements(page = 1, perPage = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });

      const response = await fetch(`${API_BASE_URL}/advertisements/pending?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching pending advertisements:', error);
      return { success: false, error: error.message };
    }
  }

  // Approve advertisement (admin only)
  async approveAdvertisement(adId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${adId}/approve`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error approving advertisement:', error);
      return { success: false, error: error.message };
    }
  }

  // Reject advertisement (admin only)
  async rejectAdvertisement(adId, adminNotes) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${adId}/reject`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ admin_notes: adminNotes })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error rejecting advertisement:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active advertisements (public)
  async getActiveAdvertisements(limit = 20) {
    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await fetch(`${API_BASE_URL}/advertisements/active${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching active advertisements:', error);
      return { success: false, error: error.message };
    }
  }

  // Track impression of advertisement
  async trackImpression(adId) {
    try {
      await fetch(`${API_BASE_URL}/advertisements/${adId}/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }

  // Update advertisement (admin only - can update status but not payment_status)
  async updateAdvertisement(adId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${adId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating advertisement:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete advertisement (admin only)
  async deleteAdvertisement(adId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${adId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AdvertisementAPI();

