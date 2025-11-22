import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GoogleSignInButton = ({ onSuccess, onError, disabled = false, mode = 'signin' }) => {
  // Determine button text based on mode
  const buttonText = mode === 'signup' ? 'signup_with' : 'signin_with';
  
  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap={false}
        disabled={disabled}
        theme="outline"
        size="large"
        width="100%"
        text={buttonText}
        shape="rectangular"
        logo_alignment="left"
        locale="en"
        containerProps={{
          style: {
            width: '100%',
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
        buttonProps={{
          style: {
            width: '100%',
            height: '48px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '500',
            border: '2px solid #e2e8f0',
            background: 'white',
            color: '#374151',
            transition: 'all 0.2s',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1
          }
        }}
      />
    </div>
  );
};

export default GoogleSignInButton;