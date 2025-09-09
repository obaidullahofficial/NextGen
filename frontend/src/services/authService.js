import { API_URL, apiRequest, authenticatedRequest, getValidToken } from './baseApiService.js';

// ===================
// AUTH API FUNCTIONS
// ===================

/**
 * Check if an email is already registered
 * @param {string} email - Email address to check
 * @returns {Promise<Object>} Response with availability status
 */
export async function checkEmail(email) {
  return apiRequest('/check-email', {
    method: 'POST',
    body: JSON.stringify({ email })
  }, 'checkEmail');
}

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Password
 * @param {string} userData.role - User role (default: "user")
 * @returns {Promise<Object>} Registration response
 */
export async function signupUser({ username, email, password, role = "user" }) {
  return apiRequest('/signup', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, role })
  }, 'signupUser');
}

/**
 * User login - Optimized for speed
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Email address
 * @param {string} credentials.password - Password
 * @returns {Promise<Object>} Login response with token and user data
 */
export async function loginUser({ email, password }) {
  // Quick validation
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Handle errors efficiently
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: data.error,
          message: data.message,
          status: response.status
        };
      } else {
        throw new Error(data.error || 'Login failed');
      }
    }

    // Quick success log
    console.log(`[Auth] Login successful for ${data.user?.role || 'user'}`);
    return data;
    
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    throw error;
  }
}

/**
 * Register a new society
 * @param {Object} societyData - Society registration data
 * @returns {Promise<Object>} Society registration response
 */
export async function societySignup(societyData) {
  return apiRequest('/signup-society', {
    method: 'POST',
    body: JSON.stringify(societyData)
  }, 'societySignup');
}

/**
 * Get current user's society information
 * @returns {Promise<Object>} Society data for current user
 */
export async function getMySociety() {
  return authenticatedRequest('/my-society', { method: 'GET' }, 'getMySociety');
}

/**
 * Test token validity with a simple API call
 * @returns {Promise<Object>} Token validation response
 */
export async function testTokenValidity() {
  return authenticatedRequest('/society-profile/simple-test', {
    method: 'POST',
    body: JSON.stringify({ test: "data" })
  }, 'testTokenValidity');
}

/**
 * Logout user by removing token from localStorage
 * This is a client-side operation since JWT tokens are stateless
 */
export function logout() {
  localStorage.removeItem('token');
  console.log('[Auth] User logged out, token removed');
}

/**
 * Check if user is currently logged in
 * @returns {boolean} True if user has a valid token
 */
export function isLoggedIn() {
  try {
    const token = getValidToken();
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Get current user's role from token
 * @returns {string|null} User role or null if not available
 */
export function getCurrentUserRole() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

/**
 * Get current user's ID from token
 * @returns {string|null} User ID or null if not available
 */
export function getCurrentUserId() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.user_id || payload.id || null;
  } catch {
    return null;
  }
}
