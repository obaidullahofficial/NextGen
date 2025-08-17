 const API_URL = "http://localhost:5000/api";

export async function checkEmail(email) {
  const response = await fetch(`${API_URL}/check-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return response.json();
}

export async function signupUser({ username, email, password, role = "user" }) {
  const response = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, role }),
  });
  return response.json();
}

export async function loginUser({ email, password }) {
  console.log('[API] Attempting login with:', { email });
  
  try {
    // Check if email and password are provided
    if (!email || !password) {
      console.error('[API] Missing email or password');
      throw new Error('Email and password are required');
    }

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('[API] Login response:', {
      status: response.status,
      success: data.success,
      hasToken: !!data.access_token,
      role: data.role,
      error: data.error
    });

    // For authentication/authorization errors (401, 403), return the data with error info
    // so the frontend can handle specific error types (like registration status)
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Return error data for proper handling in frontend
        return {
          success: false,
          error: data.error,
          message: data.message,
          status: response.status
        };
      } else {
        // For other errors, throw exception
        throw new Error(data.error || 'Login failed');
      }
    }

    return data;
  } catch (error) {
    console.error('[API] Login error:', error.message);
    throw error;
  }
}

export async function societySignup(societyData) {
  const response = await fetch(`${API_URL}/signup-society`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(societyData),
  });
  return response.json();
}

export async function getMySociety() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/my-society`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  return response.json();
}

// Society Profile API functions
export async function getSocietyProfile() {
  const token = localStorage.getItem('token');
  
  console.log('[getSocietyProfile] Starting profile fetch with token:', !!token);
  
  if (!token) {
    console.error('[getSocietyProfile] No token found');
    throw new Error('No authentication token found. Please log in again.');
  }
  
  try {
    console.log('[getSocietyProfile] Making API request...');
    const response = await fetch(`${API_URL}/society-profile`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    
    console.log('[getSocietyProfile] Response status:', response.status);
    
    const result = await response.json();
    console.log('[getSocietyProfile] Response data:', result);
    
    // Handle authorization errors
    if (response.status === 401) {
      console.error('[getSocietyProfile] 401 Unauthorized - clearing token');
      localStorage.removeItem('token'); // Clear invalid token
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (result.error && result.error.includes('Token has expired')) {
      console.error('[getSocietyProfile] Token expired - clearing token');
      localStorage.removeItem('token');
      throw new Error('Your session has expired. Please log in again.');
    }
    
    return result;
    
  } catch (fetchError) {
    console.error('[getSocietyProfile] Fetch error:', fetchError);
    throw fetchError;
  }
}

// Helper function to check and validate token
function getValidToken() {
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

export async function updateSocietyProfile(profileData) {
  const token = getValidToken();
  
  // Check if profileData is FormData (for file uploads) or regular object
  const isFormData = profileData instanceof FormData;
  
  const headers = {
    "Authorization": `Bearer ${token}`
  };
  
  // Don't set Content-Type for FormData, let browser set it with boundary
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  console.log('Sending profile update request...', {
    url: `${API_URL}/society-profile`,
    method: "POST",
    isFormData,
    hasToken: !!token,
    authHeader: headers["Authorization"] ? 'Present' : 'Missing'
  });
  
  try {
    const response = await fetch(`${API_URL}/society-profile`, {
      method: "POST",
      headers,
      body: isFormData ? profileData : JSON.stringify(profileData)
    });
    
    const result = await response.json();
    console.log('Profile update response:', { 
      status: response.status, 
      ok: response.ok, 
      result 
    });
    
    // Handle specific authorization errors
    if (response.status === 401 || result.msg === "Missing Authorization Header") {
      localStorage.removeItem('token'); // Clear invalid token
      throw new Error('Authentication failed. Please log in again.');
    }
    
    return result;
    
  } catch (error) {
    console.error('Profile update request failed:', error);
    throw error;
  }
}

export async function checkProfileCompleteness() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  
  const response = await fetch(`${API_URL}/society-profile/completeness`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  
  const result = await response.json();
  
  // Handle authorization errors
  if (response.status === 401 || result.msg === "Missing Authorization Header") {
    localStorage.removeItem('token'); // Clear invalid token
    throw new Error('Authentication failed. Please log in again.');
  }
  
  return result;
}

export async function initializeSocietyProfile() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/society-profile/initialize`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  return response.json();
}

export async function getMissingFields() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/society-profile/missing-fields`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  return response.json();
}

export async function debugSocietyProfile() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/society-profile/debug`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  return response.json();
}

// Get session time remaining in minutes
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

// Check if session will expire soon (within 5 minutes)
export function isSessionExpiringSoon() {
  const timeRemaining = getSessionTimeRemaining();
  return timeRemaining > 0 && timeRemaining <= 5;
}

// Test token validity
export async function testTokenValidity() {
  const token = getValidToken();
  
  try {
    const response = await fetch(`${API_URL}/society-profile/simple-test`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ test: "data" })
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Token is invalid or expired');
    }
    
    return result;
  } catch (error) {
    console.error('Token test failed:', error);
    throw error;
  }
}

// ===================
// PLOT API FUNCTIONS
// ===================

/**
 * Get all plots for the current society
 */
export async function getPlots() {
  const token = getValidToken();
  
  console.log('[getPlots] Fetching plots...');
  
  try {
    const response = await fetch(`${API_URL}/plots`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    
    const result = await response.json();
    console.log('[getPlots] Response:', { status: response.status, result });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch plots');
    }
    
    return result;
  } catch (error) {
    console.error('[getPlots] Error:', error);
    throw error;
  }
}

/**
 * Create a new plot
 */
export async function createPlot(plotData) {
  const token = getValidToken();
  
  console.log('[createPlot] Creating plot with data:', plotData);
  
  // Check if plotData is FormData (for file uploads) or regular object
  const isFormData = plotData instanceof FormData;
  
  const headers = {
    "Authorization": `Bearer ${token}`
  };
  
  // Don't set Content-Type for FormData, let browser set it with boundary
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  try {
    const response = await fetch(`${API_URL}/plots`, {
      method: "POST",
      headers,
      body: isFormData ? plotData : JSON.stringify(plotData)
    });
    
    const result = await response.json();
    console.log('[createPlot] Response:', { status: response.status, result });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create plot');
    }
    
    return result;
  } catch (error) {
    console.error('[createPlot] Error:', error);
    throw error;
  }
}

/**
 * Get a single plot by ID
 */
export async function getPlot(plotId) {
  const token = getValidToken();
  
  console.log('[getPlot] Fetching plot:', plotId);
  
  try {
    const response = await fetch(`${API_URL}/plots/${plotId}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    
    const result = await response.json();
    console.log('[getPlot] Response:', { status: response.status, result });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch plot');
    }
    
    return result;
  } catch (error) {
    console.error('[getPlot] Error:', error);
    throw error;
  }
}

/**
 * Update an existing plot
 */
export async function updatePlot(plotId, plotData) {
  const token = getValidToken();
  
  console.log('[updatePlot] Updating plot:', plotId, 'with data:', plotData);
  
  // Check if plotData is FormData (for file uploads) or regular object
  const isFormData = plotData instanceof FormData;
  
  const headers = {
    "Authorization": `Bearer ${token}`
  };
  
  // Don't set Content-Type for FormData, let browser set it with boundary
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  try {
    const response = await fetch(`${API_URL}/plots/${plotId}`, {
      method: "PUT",
      headers,
      body: isFormData ? plotData : JSON.stringify(plotData)
    });
    
    const result = await response.json();
    console.log('[updatePlot] Response:', { status: response.status, result });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update plot');
    }
    
    return result;
  } catch (error) {
    console.error('[updatePlot] Error:', error);
    throw error;
  }
}

/**
 * Delete a plot
 */
export async function deletePlot(plotId) {
  const token = getValidToken();
  
  console.log('[deletePlot] Deleting plot:', plotId);
  
  try {
    const response = await fetch(`${API_URL}/plots/${plotId}`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    
    const result = await response.json();
    console.log('[deletePlot] Response:', { status: response.status, result });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete plot');
    }
    
    return result;
  } catch (error) {
    console.error('[deletePlot] Error:', error);
    throw error;
  }
}
