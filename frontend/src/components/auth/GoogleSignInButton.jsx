import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GoogleSignInButton = ({ onSuccess, onError, disabled = false, mode = 'signin' }) => {
  // Determine button text based on mode
  const buttonText = mode === 'signup' ? 'signup_with' : 'signin_with';
  
  // Enhanced error handler to prevent console warnings
  const handleError = (error) => {
    // Suppress Cross-Origin-Opener-Policy related warnings
    if (error && typeof error === 'object' && !error.type?.includes('popup')) {
      onError(error);
    }
  };
  
  return (
    <div className="w-full" style={{ width: '100%' }}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={handleError}
        useOneTap={false}
        disabled={disabled}
        theme="outline"
        size="large"
        text={buttonText}
        shape="rectangular"
        logo_alignment="left"
        locale="en"
        width={400}
        auto_select={false}
        cancel_on_tap_outside={false}
      />
    </div>
  );
};

export default GoogleSignInButton;
