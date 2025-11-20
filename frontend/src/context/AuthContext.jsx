import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as loginUserService, logout as logoutService, API_URL } from '../services/apiService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on initial mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUserService({ email, password });
      console.log('Login response:', data); // Debug log
      
      // Check if login was successful
      if (!data.success) {
        throw new Error(data.error || data.message || 'Login failed');
      }
      
      // Store user data from backend response
      const userData = {
        id: data.user?.id,  // Include user ID
        email: data.email || email,
        role: data.user?.role || data.role,
        username: data.user?.username,
        societyId: data.societyId
      };

      console.log('Storing user data:', userData); // Debug log

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Store token if available
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
      }
      
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
      
      // Update user object with profile data
      const updatedUser = {
        ...user,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        phone: profileData.phone,
        profileImage: profileData.profile_image,
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

  const logout = async () => {
    try {
      // Call logout endpoint using service (for server-side logout)
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Use auth service logout function
      logoutService();
      
      // Clear context user data
      localStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, clear local state
      logoutService();
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    }
  };

  // Check if the current user session is still valid
  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/check-auth`, {
        credentials: 'include',
      });

      if (!response.ok) {
        // If session is invalid, clear local state
        localStorage.removeItem('user');
        setUser(null);
        return false;
      }

      await response.json();
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
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
    logout,
    updateUserProfile,
    checkAuth,
    hasRole,
    belongsToSociety,
    loading
  };

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
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