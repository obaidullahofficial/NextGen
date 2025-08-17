import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkProfileCompleteness } from '../../services/apiService';
import { Box, Typography, CircularProgress } from '@mui/material';

const ProtectedSubAdminRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('[PROTECTED ROUTE] No token, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('[PROTECTED ROUTE] Token exists, checking profile completeness...');
      console.log('[PROTECTED ROUTE] Current location:', window.location.pathname);
      
      // TEMPORARY: Bypass profile completeness check for testing
      try {
        console.log('[PROTECTED ROUTE] Making profile completeness API call...');
        const result = await checkProfileCompleteness();
        console.log('[PROTECTED ROUTE] Profile completeness result:', {
          success: result.success,
          is_complete: result.is_complete,
          missing_fields: result.missing_fields,
          message: result.message,
          fullResult: result
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
        console.error('[PROTECTED ROUTE] API Error:', apiError);
        
        // If it's an auth error, go to login. Otherwise, try profile setup
        if (apiError.message.includes('Authentication') || apiError.message.includes('log in')) {
          console.log('[PROTECTED ROUTE] Auth error, redirecting to login');
          navigate('/login');
        } else {
          console.log('[PROTECTED ROUTE] Other error, redirecting to profile setup');
          navigate('/society-profile-setup');
        }
        return;
      }
      
    } catch (error) {
      console.error('[PROTECTED ROUTE] Unexpected error:', error);
      navigate('/login');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ color: '#ED7600', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Checking profile status...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (profileComplete) {
    return children;
  }

  // This should not be reached due to redirects above, but just in case
  return null;
};

export default ProtectedSubAdminRoute;