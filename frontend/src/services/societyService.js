import { authenticatedRequest, API_URL } from './baseApiService.js';

// ============================
// SOCIETY PROFILE API FUNCTIONS
// ============================

/**
 * Get current society's profile data
 * @returns {Promise<Object>} Society profile data
 */
export async function getSocietyProfile() {
  console.log('[getSocietyProfile] Starting profile fetch...');
  
  try {
    const result = await authenticatedRequest('/society-profile', {
      method: 'GET'
    }, 'getSocietyProfile');
    
    console.log('[getSocietyProfile] Response data:', result);
    return result;
    
  } catch (fetchError) {
    console.error('[getSocietyProfile] Fetch error:', fetchError);
    throw fetchError;
  }
}

/**
 * Update society profile data
 * @param {Object|FormData} profileData - Profile data to update (can be FormData for file uploads)
 * @returns {Promise<Object>} Update response
 */
export async function updateSocietyProfile(profileData) {
  // Check if profileData is FormData (for file uploads) or regular object
  const isFormData = profileData instanceof FormData;
  
  console.log('Sending profile update request...', {
    isFormData,
    method: 'POST'
  });
  
  try {
    const result = await authenticatedRequest('/society-profile', {
      method: 'POST',
      body: isFormData ? profileData : JSON.stringify(profileData)
    }, 'updateSocietyProfile');
    
    console.log('Profile update response:', result);
    return result;
    
  } catch (error) {
    console.error('Profile update request failed:', error);
    throw error;
  }
}

/**
 * Check if society profile is complete
 * @returns {Promise<Object>} Profile completeness status
 */
export async function checkProfileCompleteness() {
  return authenticatedRequest('/society-profile/completeness', {
    method: 'GET'
  }, 'checkProfileCompleteness');
}

/**
 * Initialize society profile with default values
 * @returns {Promise<Object>} Initialization response
 */
export async function initializeSocietyProfile() {
  return authenticatedRequest('/society-profile/initialize', {
    method: 'POST'
  }, 'initializeSocietyProfile');
}

/**
 * Get list of missing required fields in society profile
 * @returns {Promise<Object>} Missing fields information
 */
export async function getMissingFields() {
  return authenticatedRequest('/society-profile/missing-fields', {
    method: 'GET'
  }, 'getMissingFields');
}

/**
 * Debug society profile data (for development purposes)
 * @returns {Promise<Object>} Debug information
 */
export async function debugSocietyProfile() {
  return authenticatedRequest('/society-profile/debug', {
    method: 'GET'
  }, 'debugSocietyProfile');
}

/**
 * Get all society profiles (public endpoint for browsing societies)
 * @returns {Promise<Object>} List of all society profiles
 */
export async function getAllSocietyProfiles() {
  console.log('[getAllSocietyProfiles] Fetching all society profiles...');
  
  try {
    // This is a public endpoint, no authentication required
    const response = await fetch(`${API_URL}/society-profiles`);
    const result = await response.json();
    
    console.log('[getAllSocietyProfiles] Response:', { status: response.status, result });
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch society profiles');
    }
    
    return result;
  } catch (error) {
    console.error('[getAllSocietyProfiles] Error:', error);
    throw error;
  }
}
