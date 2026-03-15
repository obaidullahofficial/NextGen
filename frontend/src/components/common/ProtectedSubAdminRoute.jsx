import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkProfileCompleteness } from '../../services/apiService';
import { Box, Typography, CircularProgress } from '@mui/material';

const ProtectedSubAdminRoute = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      checkProfile();
    }
  }, [authLoading]);

  const checkProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token || !user) {
        console.log('[PROTECTED ROUTE] No token or user, redirecting to login');
        navigate('/login');
        return;
      }

      // Check if user is subadmin (role can be 'subadmin' or 'society')
      if (user.role !== 'subadmin' && user.role !== 'society') {
        console.log('[PROTECTED ROUTE] User is not subadmin, redirecting based on role');
        if (user.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
        return;
      }

      console.log('[PROTECTED ROUTE] Token exists, checking profile completeness...');
      console.log('[PROTECTED ROUTE] Current location:', window.location.pathname);
      
      // Check profile completeness
      try {
        console.log('[PROTECTED ROUTE] Making profile completeness API call...');
        const result = await checkProfileCompleteness();
        console.log('[PROTECTED ROUTE] Profile completeness result:', {
          success: result.success,
          is_complete: result.is_complete,
          missing_fields: result.missing_fields,
          message: result.message
        });
        
        if (result.success) {
          if (result.is_complete) {
            console.log('[PROTECTED ROUTE] Profile is complete, allowing access');
            setProfileComplete(true);
          } else {
            console.log('[PROTECTED ROUTE] Profile incomplete, redirecting to setup');
            navigate('/society-profile-setup');
            return;
          }
        } else {
          console.log('[PROTECTED ROUTE] Error in completeness check, redirecting to setup');
          navigate('/society-profile-setup');
          return;
        }
      } catch (apiError) {
        console.error('[PROTECTED ROUTE] API error:', apiError);
        // On API error, allow access but log the error
        setProfileComplete(true);
      }
    } catch (error) {
      console.error('[PROTECTED ROUTE] Error in checkProfile:', error);
      setProfileComplete(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#ED7600] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // No user - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is not subadmin - redirect to their dashboard
  if (user.role !== 'subadmin' && user.role !== 'society') {
    if (user.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Show loading while checking profile
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#ED7600] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Checking profile status...</p>
        </div>
      </div>
    );
  }

  // Profile complete - render children
  if (profileComplete) {
    return children;
  }

  // Fallback - should not reach here due to redirects above
  return null;
};

export default ProtectedSubAdminRoute;
