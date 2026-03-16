import { authenticatedRequest, API_URL } from './baseApiService.js';
import { userProfileAPI } from './userProfileAPI.js';

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
 * Caches the promise to prevent multiple re-fetches across tab changes
 * @returns {Promise<Object>} List of all society profiles
 */
let societyProfilesPromise = null;

export async function getAllSocietyProfiles(forceRefresh = false) {
  if (societyProfilesPromise && !forceRefresh) {
    console.log('[getAllSocietyProfiles] Returning cached profiles promise with auto bg-update...');
    
    // Background validation and auto plot preloading (Stale-While-Revalidate)
    fetch(`${API_URL}/society-profiles`)
      .then(res => res.json())
      .then(result => {
        // Silently update cache
        societyProfilesPromise = Promise.resolve(result);
        
        // Auto-preload plots in the background
        const dataArray = result.data || result.societies || result;
        if (Array.isArray(dataArray)) {
          dataArray.forEach(soc => {
            userProfileAPI.getPlotsBySociety(soc._id, true).catch(() => {});
          });
        }
      })
      .catch(err => console.error('Background society refresh failed', err));
      
    return societyProfilesPromise;
  }

  console.log('[getAllSocietyProfiles] Fetching all society profiles...');
  
  societyProfilesPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/society-profiles`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch society profiles');
      }
      
      // Auto-preload plots in the background after main fetch
      setTimeout(() => {
        const dataArray = result.data || result.societies || result;
        if (Array.isArray(dataArray)) {
          dataArray.forEach(soc => {
            userProfileAPI.getPlotsBySociety(soc._id).catch(() => {});
          });
        }
      }, 500); // 500ms delay to let the main thread render first
      
      return result;
    } catch (error) {
      console.error('[getAllSocietyProfiles] Error:', error);
      societyProfilesPromise = null; 
      throw error;
    }
  })();

  return societyProfilesPromise;
}

export function preloadSocietyProfiles() {
  getAllSocietyProfiles().catch(() => {});
}
