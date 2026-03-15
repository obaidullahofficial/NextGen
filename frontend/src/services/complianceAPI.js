import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '$API_URL';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
};

/**
 * Create new compliance rules for a plot size (Sub-admin only)
 */
export const createCompliance = async (complianceData) => {
  try {
    const response = await axios.post(
      `${API_URL}/compliance/create`,
      complianceData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error creating compliance:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get all compliance rules for a society
 */
export const getSocietyCompliances = async (societyId) => {
  try {
    const response = await axios.get(
      `${API_URL}/compliance/society/${societyId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching society compliances:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get compliance rules for a specific plot size
 */
export const getComplianceByPlotSize = async (societyId, marlaSize) => {
  try {
    const response = await axios.get(
      `${API_URL}/compliance/society/${societyId}/marla/${marlaSize}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching compliance by plot size:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get applicable compliance rules for a plot (used during floor plan generation)
 */
export const getComplianceForPlot = async (plotId) => {
  try {
    const response = await axios.get(
      `${API_URL}/compliance/plot/${plotId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching compliance for plot:', error);
    throw error.response?.data || error;
  }
};

/**
 * Update existing compliance rules (Sub-admin only)
 */
export const updateCompliance = async (complianceId, complianceData) => {
  try {
    const response = await axios.put(
      `${API_URL}/compliance/update/${complianceId}`,
      complianceData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error updating compliance:', error);
    throw error.response?.data || error;
  }
};

/**
 * Delete compliance rules (Sub-admin only)
 */
export const deleteCompliance = async (complianceId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/compliance/delete/${complianceId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting compliance:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get marla dimensions for auto-fill functionality
 */
export const getMarlaDimensions = async (marlaSize) => {
  try {
    const response = await axios.get(
      `${API_URL}/compliance/marla-dimensions/${marlaSize}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching marla dimensions:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get available marla sizes for society with plot dimension auto-fill
 */
export const getAvailableMarlas = async (societyId) => {
  try {
    const response = await axios.get(
      `${API_URL}/compliance/available-marla-sizes/${societyId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching available marlas:', error);
    throw error.response?.data || error;
  }
};
