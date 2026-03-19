// Base API service with common configuration and utilities
export const API_URL = import.meta.env.VITE_API_URL || "https://nextgen-ta95.onrender.com/api";

/**
 * Helper function to get and validate authentication token
 * @returns {string} Valid JWT token
 * @throws {Error} If token is missing or invalid
 */
export function getValidToken() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found in localStorage');
    throw new Error('No authentication token found. Please log in again.');
  }
  
  // Basic token format validation
  if (!token.includes('.') || token.split('.').length !== 3) {
    console.error('Invalid token format');
    localStorage.removeItem('token');
    throw new Error('Invalid token format. Please log in again.');
  }
  
  // TEMPORARY: Disable client-side token validation to test backend
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    console.log('Token validation details (CLIENT-SIDE VALIDATION DISABLED):', {
      tokenExists: true,
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      hasProperFormat: true,
      payload: payload,
      currentTimeUTC: new Date(currentTime * 1000).toISOString(),
      tokenExpUTC: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Never',
      secondsUntilExpiry: payload.exp ? (payload.exp - currentTime) : 'Never',
      minutesUntilExpiry: payload.exp ? Math.round((payload.exp - currentTime) / 60) : 'Never',
      note: 'CLIENT-SIDE EXPIRATION CHECK DISABLED FOR TESTING'
    });
    
    // TEMPORARILY DISABLED - Let server handle all validation
    /*
    if (payload.exp && payload.exp < currentTime) {
      console.error('Token has expired!', {
        tokenExp: payload.exp,
        currentTime: currentTime,
        differenceSeconds: currentTime - payload.exp,
        tokenExpDate: new Date(payload.exp * 1000).toISOString(),
        currentDate: new Date(currentTime * 1000).toISOString()
      });
      localStorage.removeItem('token');
      throw new Error('Your session has expired. Please log in again.');
    }
    */
    
  } catch (decodeError) {
    console.error('Error decoding token:', decodeError);
    localStorage.removeItem('token');
    throw new Error('Invalid token format. Please log in again.');
  }
  
  return token;
}

/**
 * Helper function to create request headers for authenticated requests
 * @param {boolean} includeContentType - Whether to include Content-Type header
 * @returns {Object} Headers object with Authorization
 */
export function createAuthHeaders(includeContentType = true) {
  const token = getValidToken();
  const headers = {
    "Authorization": `Bearer ${token}`
  };
  
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  
  return headers;
}

/**
 * Generic API request helper with error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @param {string} context - Context for logging (e.g., 'getUserData')
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function apiRequest(endpoint, options = {}, context = 'apiRequest') {
  const url = `${API_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  
  console.log(`[${context}] Making request to:`, url, options.method || 'GET');
  
  try {
    const mergedHeaders = {
      ...options.headers
    };

    // Keep JSON as default only for non-FormData requests.
    if (!isFormData && !mergedHeaders["Content-Type"]) {
      mergedHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders
    });
    
    const result = await response.json();
    console.log(`[${context}] Response:`, { status: response.status, result });
    
    // Handle authorization errors
    if (response.status === 401) {
      console.error(`[${context}] 401 Unauthorized - clearing token`);
      localStorage.removeItem('token');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    // Handle token expiration
    if (result.error && result.error.includes('Token has expired')) {
      console.error(`[${context}] Token expired - clearing token`);
      localStorage.removeItem('token');
      throw new Error('Your session has expired. Please log in again.');
    }
    
    // Handle missing authorization header
    if (result.msg === "Missing Authorization Header") {
      localStorage.removeItem('token');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
      throw new Error(result.error || result.message || `HTTP ${response.status}: Request failed`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    throw error;
  }
}

/**
 * Helper for authenticated requests with proper header handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 * @param {string} context - Context for logging
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function authenticatedRequest(endpoint, options = {}, context = 'authenticatedRequest') {
  const token = getValidToken();
  
  // Check if body is FormData (for file uploads)
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    "Authorization": `Bearer ${token}`,
    ...options.headers
  };
  
  // Don't set Content-Type for FormData, let browser set it with boundary
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  
  return apiRequest(endpoint, { ...options, headers }, context);
}

/**
 * Get session time remaining in minutes
 * @returns {number} Minutes remaining in session, 0 if expired or invalid
 */
export function getSessionTimeRemaining() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp > currentTime) {
      return Math.round((payload.exp - currentTime) / 60);
    }
    
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Check if session will expire soon (within 5 minutes)
 * @returns {boolean} True if session expires within 5 minutes
 */
export function isSessionExpiringSoon() {
  const timeRemaining = getSessionTimeRemaining();
  return timeRemaining > 0 && timeRemaining <= 5;
}
