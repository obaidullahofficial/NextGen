import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GoogleSignInButton = ({ onSuccess, onError, disabled = false, mode = 'signin' }) => {
  // Determine button text based on mode
  const buttonText = mode === 'signup' ? 'signup_with' : 'signin_with';
  
  return (
    <div className="w-full" style={{ width: '100%' }}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap={false}
        disabled={disabled}
        theme="outline"
        size="large"
        text={buttonText}
        shape="rectangular"
        logo_alignment="left"
        locale="en"
        width={400}
      />
    </div>
  );
};

export default GoogleSignInButton;