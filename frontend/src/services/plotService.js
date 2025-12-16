import { authenticatedRequest } from './baseApiService.js';

// ===================
// PLOT API FUNCTIONS
// ===================

/**
 * Get all plots for the current society
 * @returns {Promise<Object>} List of plots
 */
export async function getPlots() {
  console.log('[getPlots] Fetching plots...');
  
  try {
    const result = await authenticatedRequest('/plots', {
      method: 'GET'
    }, 'getPlots');
    
    console.log('[getPlots] Response:', result);
    
    // Backend returns array directly, wrap it in expected format
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result
      };
    }
    
    // If result already has the expected format
    if (result.success !== undefined) {
      return result;
    }
    
    // Fallback: treat result as data
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('[getPlots] Error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Create a new plot
 * @param {Object|FormData} plotData - Plot data (can be FormData for file uploads)
 * @returns {Promise<Object>} Created plot data
 */
export async function createPlot(plotData) {
  console.log('[createPlot] Creating plot with data:', plotData);
  
  // Check if plotData is FormData (for file uploads) or regular object
  const isFormData = plotData instanceof FormData;
  
  try {
    const result = await authenticatedRequest('/plots', {
      method: 'POST',
      body: isFormData ? plotData : JSON.stringify(plotData)
    }, 'createPlot');
    
    console.log('[createPlot] Response:', result);
    return result;
  } catch (error) {
    console.error('[createPlot] Error:', error);
    throw error;
  }
}

/**
 * Get a single plot by ID
 * @param {string|number} plotId - Plot identifier
 * @returns {Promise<Object>} Plot data
 */
export async function getPlot(plotId) {
  console.log('[getPlot] Fetching plot:', plotId);
  
  try {
    const result = await authenticatedRequest(`/plots/${plotId}`, {
      method: 'GET'
    }, 'getPlot');
    
    console.log('[getPlot] Response:', result);
    return result;
  } catch (error) {
    console.error('[getPlot] Error:', error);
    throw error;
  }
}

/**
 * Update an existing plot
 * @param {string|number} plotId - Plot identifier
 * @param {Object|FormData} plotData - Updated plot data (can be FormData for file uploads)
 * @returns {Promise<Object>} Updated plot data
 */
export async function updatePlot(plotId, plotData) {
  console.log('[updatePlot] Updating plot:', plotId, 'with data:', plotData);
  
  // Check if plotData is FormData (for file uploads) or regular object
  const isFormData = plotData instanceof FormData;
  
  try {
    const result = await authenticatedRequest(`/plots/${plotId}`, {
      method: 'PUT',
      body: isFormData ? plotData : JSON.stringify(plotData)
    }, 'updatePlot');
    
    console.log('[updatePlot] Response:', result);
    return result;
  } catch (error) {
    console.error('[updatePlot] Error:', error);
    throw error;
  }
}

/**
 * Delete a plot
 * @param {string|number} plotId - Plot identifier
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deletePlot(plotId) {
  console.log('[deletePlot] Deleting plot:', plotId);
  
  try {
    const result = await authenticatedRequest(`/plots/${plotId}`, {
      method: 'DELETE'
    }, 'deletePlot');
    
    console.log('[deletePlot] Response:', result);
    return result;
  } catch (error) {
    console.error('[deletePlot] Error:', error);
    throw error;
  }
}

/**
 * Get plots with filtering options
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Plot status filter
 * @param {string} filters.type - Plot type filter
 * @param {number} filters.page - Page number for pagination
 * @param {number} filters.limit - Number of items per page
 * @returns {Promise<Object>} Filtered plots list
 */
export async function getPlotsFiltered(filters = {}) {
  console.log('[getPlotsFiltered] Fetching plots with filters:', filters);
  
  // Build query string from filters
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/plots?${queryString}` : '/plots';
  
  try {
    const result = await authenticatedRequest(endpoint, {
      method: 'GET'
    }, 'getPlotsFiltered');
    
    console.log('[getPlotsFiltered] Response:', result);
    return result;
  } catch (error) {
    console.error('[getPlotsFiltered] Error:', error);
    throw error;
  }
}
