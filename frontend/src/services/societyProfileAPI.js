// API service for Society Profiles CRUD operations

const API_BASE_URL = '$API_URL';

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const societyProfileAPI = {
  // GET all society profiles (alias for backward compatibility)
  getAllSocieties: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/society-profiles`);
      const result = await handleResponse(response);
      return {
        success: true,
        data: result.data || result.society_profiles || result || []
      };
    } catch (error) {
      console.error('Error fetching society profiles:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // GET all society profiles
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/society-profiles`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching society profiles:', error);
      throw error;
    }
  },

  // GET society statistics
  getSocietyStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/society-profiles/stats`);
      const result = await handleResponse(response);
      return {
        success: true,
        data: result.data || result || {}
      };
    } catch (error) {
      console.error('Error fetching society stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          total_societies: 0,
          approved_societies: 0,
          pending_societies: 0,
          rejected_societies: 0
        }
      };
    }
  },

  // GET single society profile by ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/society-profiles/${id}`);
      return await handleResponse(response);
    } catch (error) {
      console.error(`Error fetching society profile ${id}:`, error);
      throw error;
    }
  },

  // POST create new society profile
  create: async (societyData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/society-profiles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(societyData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating society profile:', error);
      throw error;
    }
  },

  // PUT update society profile
  update: async (id, societyData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/society-profiles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(societyData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error(`Error updating society profile ${id}:`, error);
      throw error;
    }
  },

  // DELETE society profile
  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/society-profiles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error(`Error deleting society profile ${id}:`, error);
      throw error;
    }
  }
};

export default societyProfileAPI;
