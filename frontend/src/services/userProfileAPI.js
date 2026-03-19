// User Profile API Service
// This file contains all API calls for user profile functionality

const API_BASE_URL = 'https://nextgen-ta95.onrender.com/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

// Global Cache Storage for User Module
let societiesCache = null;
let plotsCache = {}; // { societyId: promise }

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }
  return data;
};

export const userProfileAPI = {
  // ============= PROFILE MANAGEMENT =============
  
  /**
   * Get current user's profile
   */
  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Create or update user profile
   * @param {FormData} formData - Form data containing profile information and files
   */
  async updateProfile(formData) {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    return handleResponse(response);
  },

  /**
   * Delete user profile
   */
  async deleteProfile() {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ============= SOCIETIES & PLOTS =============

  /**
   * Get all registered societies (public endpoint) with caching
   * @param {boolean} forceRefresh - If true, bypass cache
   */
  async getSocieties(forceRefresh = false) {
    if (societiesCache && !forceRefresh) {
      // Return cached promise but do a background refresh
      const cachedPromise = societiesCache;
      // Background validation to update cache silently
      fetch(`${API_BASE_URL}/society-profiles`, { method: 'GET' })
        .then(response => handleResponse(response))
        .then(data => {
          societiesCache = Promise.resolve(data);
          // Auto-preload plots in the background when societies refresh
          if (data.societies && Array.isArray(data.societies)) {
            data.societies.forEach(soc => {
              this.getPlotsBySociety(soc._id, true).catch(() => {});
            });
          } else if (Array.isArray(data)) {
            data.forEach(soc => {
              this.getPlotsBySociety(soc._id, true).catch(() => {});
            });
          }
        })
        .catch(err => console.error('Background society refresh failed:', err));
      return cachedPromise;
    }

    societiesCache = fetch(`${API_BASE_URL}/society-profiles`, {
      method: 'GET',
    }).then(response => handleResponse(response));

    const result = await societiesCache;
    
    // Auto-preload plots for all societies softly in the background
    try {
      const societyList = result.societies ? result.societies : (Array.isArray(result) ? result : []);
      societyList.forEach(soc => {
        // Preload plots for each society
        this.getPlotsBySociety(soc._id).catch(() => {});
      });
    } catch (e) {}

    return result;
  },

  /**
   * Get plots for a specific society (public endpoint) with caching
   * @param {string} societyId
   * @param {boolean} forceRefresh - If true, bypass cache
   */
  async getPlotsBySociety(societyId, forceRefresh = false) {
    if (plotsCache[societyId] && !forceRefresh) {
      // Return cached promise but do a background refresh
      const cachedPromise = plotsCache[societyId];
      fetch(`${API_BASE_URL}/plots/society/${societyId}`, { method: 'GET' })
        .then(response => handleResponse(response))
        .then(data => {
          plotsCache[societyId] = Promise.resolve(data);
        })
        .catch(err => console.error('Background plot refresh failed:', err));
      return cachedPromise;
    }

    plotsCache[societyId] = fetch(`${API_BASE_URL}/plots/society/${societyId}`, {
      method: 'GET',
    }).then(response => handleResponse(response));
    
    return plotsCache[societyId];
  },

  // ============= APPROVAL REQUESTS =============

  /**
   * Get all approval requests for current user
   */
  async getApprovalRequests() {
    const response = await fetch(`${API_BASE_URL}/approval-requests`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Create a new approval request
   * @param {FormData} formData - Form data containing request information and files
   */
  async createApprovalRequest(formData) {
    const response = await fetch(`${API_BASE_URL}/approval-requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    return handleResponse(response);
  },

  /**
   * Get a specific approval request
   * @param {string} requestId - The approval request ID
   */
  async getApprovalRequest(requestId) {
    const response = await fetch(`${API_BASE_URL}/approval-requests/${requestId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update an approval request
   * @param {string} requestId - The approval request ID
   * @param {Object} updateData - Data to update
   */
  async updateApprovalRequest(requestId, updateData) {
    const response = await fetch(`${API_BASE_URL}/approval-requests/${requestId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  /**
   * Delete an approval request
   * @param {string} requestId - The approval request ID
   */
  async deleteApprovalRequest(requestId) {
    const response = await fetch(`${API_BASE_URL}/approval-requests/${requestId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ============= USER ACTIVITIES & PROGRESS =============

  /**
   * Get user activities with pagination
   * @param {number} limit - Number of activities to retrieve
   * @param {number} offset - Number of activities to skip
   */
  async getUserActivities(limit = 50, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/activities?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );
    return handleResponse(response);
  },

  /**
   * Get user progress summary
   */
  async getUserProgress() {
    const response = await fetch(`${API_BASE_URL}/progress`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ============= ADMIN FUNCTIONS =============

  /**
   * Get all approval requests (admin only)
   */
  async getAllApprovalRequests() {
    const response = await fetch(`${API_BASE_URL}/admin/approval-requests`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update approval request status (admin only)
   * @param {string} requestId - The approval request ID
   * @param {string} status - New status (Pending, Approved, Rejected, In Review)
   * @param {string} adminComments - Admin comments
   */
  async updateApprovalRequestStatus(requestId, status, adminComments = '') {
    const response = await fetch(
      `${API_BASE_URL}/admin/approval-requests/${requestId}/status`,
      {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          admin_comments: adminComments,
        }),
      }
    );
    return handleResponse(response);
  },
};

// ============= HELPER FUNCTIONS FOR FORM DATA =============

/**
 * Create FormData for profile update
 * @param {Object} profileData - Profile data object
 * @param {Object} files - File objects
 */
export const createProfileFormData = (profileData, files = {}) => {
  const formData = new FormData();
  
  // Add text fields
  if (profileData.firstName) formData.append('firstName', profileData.firstName);
  if (profileData.lastName) formData.append('lastName', profileData.lastName);
  if (profileData.cnic) formData.append('cnic', profileData.cnic);
  if (profileData.phone) formData.append('phone', profileData.phone);
  if (profileData.email) formData.append('email', profileData.email);
  
  // Add files
  if (files.profileImage) formData.append('profileImage', files.profileImage);
  if (files.cnicFront) formData.append('cnicFront', files.cnicFront);
  if (files.cnicBack) formData.append('cnicBack', files.cnicBack);
  
  return formData;
};

/**
 * Create FormData for approval request
 * @param {Object} requestData - Request data object
 * @param {File} floorPlanFile - Floor plan file
 */
export const createApprovalRequestFormData = (requestData, floorPlanFile) => {
  const formData = new FormData();
  
  // Add text fields
  if (requestData.societyId) formData.append('societyId', requestData.societyId);
  if (requestData.societyName) formData.append('societyName', requestData.societyName);
  if (requestData.plotId) formData.append('plotId', requestData.plotId);
  if (requestData.plotNumber) formData.append('plotNumber', requestData.plotNumber);
  if (requestData.plotDetails) formData.append('plotDetails', requestData.plotDetails);
  if (requestData.area) formData.append('area', requestData.area);
  if (requestData.designType) formData.append('designType', requestData.designType);
  if (requestData.notes) formData.append('notes', requestData.notes);
  
  // Add file
  if (floorPlanFile) formData.append('floorPlanFile', floorPlanFile);
  
  return formData;
};

export default userProfileAPI;
