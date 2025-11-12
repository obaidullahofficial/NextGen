// Frontend API service for Advertisement CRUD operations
const API_BASE_URL = 'http://localhost:5000/api';

class AdvertisementAPI {
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

  // GET /api/advertisements - Get all advertisements with filtering
  async getAllAdvertisements(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          if (Array.isArray(filters[key])) {
            queryParams.append(key, filters[key].join(','));
          } else {
            queryParams.append(key, filters[key]);
          }
        }
      });

      const url = queryParams.toString() 
        ? `${API_BASE_URL}/advertisements?${queryParams}`
        : `${API_BASE_URL}/advertisements`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || [],
          pagination: data.pagination || {},
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch advertisements'
        };
      }
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/advertisements/:id - Get specific advertisement
  async getAdvertisementById(advertisementId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${advertisementId}`, {
        method: 'GET',
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
          error: data.error || 'Failed to fetch advertisement'
        };
      }
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/advertisements/featured - Get featured advertisements
  async getFeaturedAdvertisements(limit = 5) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/featured?limit=${limit}`, {
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
          error: data.error || 'Failed to fetch featured advertisements'
        };
      }
    } catch (error) {
      console.error('Error fetching featured advertisements:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/advertisements/search - Search advertisements
  async searchAdvertisements(searchTerm, page = 1, per_page = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/search?q=${encodeURIComponent(searchTerm)}&page=${page}&per_page=${per_page}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || [],
          pagination: data.pagination || {},
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to search advertisements'
        };
      }
    } catch (error) {
      console.error('Error searching advertisements:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/users/:email/advertisements - Get advertisements by user
  async getAdvertisementsByUser(userEmail, page = 1, per_page = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userEmail)}/advertisements?page=${page}&per_page=${per_page}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || [],
          pagination: data.pagination || {},
          message: data.message
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch user advertisements'
        };
      }
    } catch (error) {
      console.error('Error fetching user advertisements:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // POST /api/advertisements - Create new advertisement
  async createAdvertisement(advertisementData) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(advertisementData)
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
          error: data.error || 'Failed to create advertisement'
        };
      }
    } catch (error) {
      console.error('Error creating advertisement:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // PUT /api/advertisements/:id - Update advertisement
  async updateAdvertisement(advertisementId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${advertisementId}`, {
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
          error: data.error || 'Failed to update advertisement'
        };
      }
    } catch (error) {
      console.error('Error updating advertisement:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // DELETE /api/advertisements/:id - Delete advertisement
  async deleteAdvertisement(advertisementId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${advertisementId}`, {
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
          error: data.error || 'Failed to delete advertisement'
        };
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // POST /api/advertisements/:id/view - Increment view count
  async incrementViewCount(advertisementId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${advertisementId}/view`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || (response.ok ? 'View count updated' : 'Failed to update view count')
      };
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // POST /api/advertisements/:id/contact - Increment contact count
  async incrementContactCount(advertisementId) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${advertisementId}/contact`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || (response.ok ? 'Contact count updated' : 'Failed to update contact count')
      };
    } catch (error) {
      console.error('Error incrementing contact count:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // GET /api/advertisements/stats - Get advertisement statistics
  async getAdvertisementStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/stats`, {
        method: 'GET',
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
          error: data.error || 'Failed to fetch advertisement statistics'
        };
      }
    } catch (error) {
      console.error('Error fetching advertisement statistics:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // PUT /api/advertisements/:id/featured - Toggle featured status
  async toggleFeaturedStatus(advertisementId, isFeatured) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${advertisementId}/featured`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ is_featured: isFeatured })
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
          error: data.error || 'Failed to toggle featured status'
        };
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // PUT /api/advertisements/:id/status - Update advertisement status
  async updateAdvertisementStatus(advertisementId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/advertisements/${advertisementId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status })
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
          error: data.error || 'Failed to update advertisement status'
        };
      }
    } catch (error) {
      console.error('Error updating advertisement status:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // Helper method to format advertisement for display
  formatAdvertisementForDisplay(advertisement) {
    if (!advertisement) return null;

    return {
      id: advertisement._id,
      title: advertisement.society_name,
      location: advertisement.location,
      plotSizes: advertisement.plot_sizes || [],
      priceRange: {
        start: advertisement.price_start,
        end: advertisement.price_end,
        formatted: advertisement.price_end 
          ? `PKR ${(advertisement.price_start / 100000).toFixed(1)} - ${(advertisement.price_end / 100000).toFixed(1)} Lacs`
          : `Starting from PKR ${(advertisement.price_start / 100000).toFixed(1)} Lacs`
      },
      contact: advertisement.contact_number,
      description: advertisement.description,
      facilities: advertisement.facilities,
      status: advertisement.status,
      isFeatured: advertisement.is_featured,
      installmentsAvailable: advertisement.installments_available,
      possessionStatus: advertisement.possession_status,
      viewCount: advertisement.view_count || 0,
      contactCount: advertisement.contact_count || 0,
      createdBy: advertisement.created_by,
      createdAt: new Date(advertisement.created_at),
      updatedAt: new Date(advertisement.updated_at),
      isActive: advertisement.status === 'active'
    };
  }
}

// Export a singleton instance
const advertisementAPI = new AdvertisementAPI();
export default advertisementAPI;

// Also export the class for custom instances if needed
export { AdvertisementAPI };
