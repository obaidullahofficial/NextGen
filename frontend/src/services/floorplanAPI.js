const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Get authentication headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }
  return data;
};

/**
 * Floorplan API service
 */
export const floorplanAPI = {
  /**
   * Get all floor plans for the current user
   */
  async getUserFloorplans(userId) {
    const response = await fetch(`${API_BASE_URL}/floorplan/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get detailed floor plan by ID
   */
  async getFloorplanDetails(floorplanId) {
    const response = await fetch(`${API_BASE_URL}/floorplan/${floorplanId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Save a new floor plan
   */
  async saveFloorplan(floorplanData) {
    const response = await fetch(`${API_BASE_URL}/floorplan/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(floorplanData),
    });
    return handleResponse(response);
  },

  /**
   * Update an existing floor plan
   */
  async updateFloorplan(floorplanData) {
    const response = await fetch(`${API_BASE_URL}/floorplan/update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(floorplanData),
    });
    return handleResponse(response);
  },

  /**
   * Delete a floor plan
   */
  async deleteFloorplan(floorplanId, userId) {
    const response = await fetch(`${API_BASE_URL}/floorplan/${floorplanId}?user_id=${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Toggle favorite status of a floor plan
   */
  async toggleFavorite(floorplanId, userId, isFavorite) {
    const response = await fetch(`${API_BASE_URL}/floorplan/update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        floorplan_id: floorplanId,
        user_id: userId,
        is_favorite: isFavorite
      }),
    });
    return handleResponse(response);
  },

  /**
   * Generate a new floor plan with AI
   */
  async generateFloorplan(constraints) {
    const response = await fetch(`${API_BASE_URL}/floorplan/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(constraints),
    });
    return handleResponse(response);
  },

  /**
   * Generate floor plan variations
   */
  async generateVariations(floorplanData) {
    const response = await fetch(`${API_BASE_URL}/floorplan/variations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(floorplanData),
    });
    return handleResponse(response);
  },
};

export default floorplanAPI;
