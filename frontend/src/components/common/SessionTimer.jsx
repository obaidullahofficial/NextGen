import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { getSessionTimeRemaining, isSessionExpiringSoon } from '../../services/apiService';

const SessionTimer = ({ showWarning = true, showTimer = false }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = getSessionTimeRemaining();
      setTimeRemaining(remaining);
      
      if (showWarning && isSessionExpiringSoon() && remaining > 0) {
        setShowExpiryWarning(true);
      } else if (remaining === 0) {
        setShowExpiryWarning(false);
      }
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [showWarning]);

  if (!timeRemaining && !showExpiryWarning) {
    return null;
  }

  return (
    <Box>
      {/* Session Expiry Warning */}
      {showExpiryWarning && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          onClose={() => setShowExpiryWarning(false)}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Session Expiring Soon!
          </Typography>
          <Typography variant="body2">
            Your session will expire in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}. 
            Please save your work or log in again to continue.
          </Typography>
        </Alert>
      )}

      {/* Optional Session Timer Display */}
      {showTimer && timeRemaining > 0 && (
        <Box sx={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          background: 'rgba(0,0,0,0.7)', 
          color: 'white', 
          padding: '8px 12px', 
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <Typography variant="caption">
            Session: {timeRemaining}m remaining
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SessionTimer;