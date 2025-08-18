// Centralized service exports for the NextGenArchitect application
// This file provides all API functions organized by domain/model

// Base API utilities (for advanced usage)
export {
  API_URL,
  getValidToken,
  createAuthHeaders,
  apiRequest,
  authenticatedRequest,
  getSessionTimeRemaining,
  isSessionExpiringSoon
} from './baseApiService.js';

// Authentication service
export {
  checkEmail,
  signupUser,
  loginUser,
  societySignup,
  getMySociety,
  testTokenValidity,
  logout,
  isLoggedIn,
  getCurrentUserRole,
  getCurrentUserId
} from './authService.js';

// Society profile service
export {
  getSocietyProfile,
  updateSocietyProfile,
  checkProfileCompleteness,
  initializeSocietyProfile,
  getMissingFields,
  debugSocietyProfile,
  getAllSocietyProfiles
} from './societyService.js';

// Plot service
export {
  getPlots,
  createPlot,
  getPlot,
  updatePlot,
  deletePlot,
  getPlotsFiltered
} from './plotService.js';
