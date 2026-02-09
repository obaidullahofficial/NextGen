import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as loginUserService, logout as logoutService, API_URL } from '../services/apiService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpiredPopup, setShowSessionExpiredPopup] = useState(false);
  
  // Session timeout duration (30 minutes in milliseconds)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Check if session has expired
  const isSessionExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) {
      console.log('No login time found, session expired');
      return true;
    }
    
    const currentTime = Date.now();
    const sessionAge = currentTime - parseInt(loginTime);
    const remainingTime = SESSION_TIMEOUT - sessionAge;
    
    console.log(`Session check: Age=${Math.floor(sessionAge/60000)} mins, Remaining=${Math.floor(remainingTime/60000)} mins, Timeout=${Math.floor(SESSION_TIMEOUT/60000)} mins`);
    
    return sessionAge > SESSION_TIMEOUT;
  };

  // Handle session expiry
  const handleSessionExpiry = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    setUser(null);
    setShowSessionExpiredPopup(true);
  };

  // Load user from localStorage on initial mount and check session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      if (isSessionExpired()) {
        handleSessionExpiry();
      } else {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  // Set up session timeout monitoring
  useEffect(() => {
    if (!user) return;

    const checkSessionInterval = setInterval(() => {
      if (isSessionExpired()) {
        console.log('Frontend session expired - showing popup');
        handleSessionExpiry();
        clearInterval(checkSessionInterval);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkSessionInterval);
  }, [user]);

  // Reset login time on any user activity to extend session
  useEffect(() => {
    if (!user) return;

    const resetSessionTimer = () => {
      const currentTime = Date.now().toString();
      localStorage.setItem('loginTime', currentTime);
      console.log('Session timer reset due to user activity');
    };

    // Listen for user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetSessionTimer);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetSessionTimer);
      });
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const data = await loginUserService({ email, password });
      console.log('Login response:', data); // Debug log
      
      // Check if login was successful
      if (!data.success) {
        throw new Error(data.error || data.message || 'Login failed');
      }
      
      // Check if society user needs to complete registration form
      if (data.registration_required) {
        console.log('Society user needs to complete registration form');
        // Store token but throw special error to redirect to registration form
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
        }
        // Store basic user data
        const basicUserData = {
          id: data.user?.id,
          email: data.email || email,
          role: data.user?.role || data.role,
          username: data.user?.username
        };
        localStorage.setItem('user', JSON.stringify(basicUserData));
        setUser(basicUserData);
        
        // Throw error with registration_required flag
        const error = new Error(data.message || 'Please complete your society registration form.');
        error.registration_required = true;
        throw error;
      }
      
      // Store token first if available
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
      }
      
      // Fetch user profile data
      let profileData = null;
      try {
        const profileResponse = await fetch(`${API_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          console.log('Profile API response:', profileResult);
          if (profileResult.success && profileResult.data) {
            profileData = profileResult.data;
            console.log('Profile data fetched:', profileData);
          } else {
            console.log('Profile not found or not created yet');
          }
        } else {
          console.log('Profile API returned status:', profileResponse.status);
        }
      } catch (profileError) {
        console.log('Could not fetch profile data:', profileError);
        // Continue with basic user data if profile fetch fails
      }
      
      // Build user data with profile information if available
      let profileImagePath = null;
      if (profileData?.profile_image_url || profileData?.profile_image) {
        profileImagePath = profileData.profile_image_url || profileData.profile_image;
        // Fix path format
        profileImagePath = profileImagePath.replace(/\\/g, '/');
        if (!profileImagePath.startsWith('/')) {
          profileImagePath = '/' + profileImagePath;
        }
      }
      
      const userData = {
        id: data.user?.id,
        email: data.email || email,
        role: data.user?.role || data.role,
        username: data.user?.username,
        societyId: data.societyId,
        // Add profile data if available
        firstName: profileData?.first_name || null,
        lastName: profileData?.last_name || null,
        phone: profileData?.phone || null,
        profileImage: profileImagePath
      };

      console.log('Storing user data:', userData); // Debug log

      // Save to localStorage with login timestamp
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', Date.now().toString());
      
      // Update context
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const updateUserProfile = (profileData) => {
    try {
      console.log('[AUTH CONTEXT] Current user:', user);
      console.log('[AUTH CONTEXT] Profile data received:', profileData);
      
      // Get profile image path and fix the format
      let profileImagePath = profileData.profile_image_url || profileData.profile_image;
      
      if (profileImagePath) {
        // Replace backslashes with forward slashes
        profileImagePath = profileImagePath.replace(/\\/g, '/');
        
        // Ensure it starts with a forward slash
        if (!profileImagePath.startsWith('/')) {
          profileImagePath = '/' + profileImagePath;
        }
      }
      
      // Update user object with profile data
      const updatedUser = {
        ...user,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        phone: profileData.phone,
        profileImage: profileImagePath,
      };
      
      console.log('[AUTH CONTEXT] Updated user object:', updatedUser);
      
      // Update localStorage and context
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile in context:', error);
      throw error;
    }
  };

  // Login with Google OAuth (directly set token and user without calling login API)
  const loginWithGoogle = (token, userData) => {
    try {
      console.log('[AUTH CONTEXT] Google login - Setting user data:', userData);
      
      // Store token
      localStorage.setItem('token', token);
      
      // Prepare user data
      const googleUserData = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        username: userData.username,
        is_admin: userData.is_admin,
        auth_method: 'google'
      };
      
      // Save to localStorage with login timestamp
      localStorage.setItem('user', JSON.stringify(googleUserData));
      localStorage.setItem('loginTime', Date.now().toString());
      
      // Update context
      setUser(googleUserData);
      
      console.log('[AUTH CONTEXT] Google login successful');
      return googleUserData;
    } catch (error) {
      console.error('[AUTH CONTEXT] Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint using service (for server-side logout)
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Use auth service logout function
      logoutService();
      
      // Clear context user data and login timestamp
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, clear local state
      logoutService();
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      setUser(null);
      throw error;
    }
  };

  // Check if the current user session is still valid
  const checkAuth = async () => {
    try {
      // Use our frontend session validation instead of backend
      if (isSessionExpired()) {
        console.log('Frontend session check: Session expired');
        return false;
      }

      const response = await fetch(`${API_URL}/check-auth`, {
        credentials: 'include',
      });

      if (!response.ok) {
        // Don't clear session here - let our frontend timer handle it
        console.log('Backend auth check failed, but using frontend session management');
        return true; // Return true to use frontend session timing
      }

      await response.json();
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't clear session on network errors - let frontend timer handle expiration
      return true;
    }
  };

  // Verify if user has required role
  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  // Check if user belongs to a specific society
  const belongsToSociety = (societyId) => {
    return user?.societyId === societyId;
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
    checkAuth,
    hasRole,
    belongsToSociety,
    loading,
    isSessionExpired,
    handleSessionExpiry
  };

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Session Expired Popup */}
      {showSessionExpiredPopup && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-4 shadow-xl border border-gray-200 border-opacity-50">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Session Expired
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your session has expired. Please login again to continue.
              </p>
              <button
                onClick={() => {
                  setShowSessionExpiredPopup(false);
                  window.location.href = '/login';
                }}
                className="w-full bg-[#ED7600] hover:bg-[#d96b00] text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Login Again
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export { AuthContext };