import React from 'react';
import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';

// You'll need to replace this with your actual Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id-here";

const GoogleOAuthProvider = ({ children }) => {
  return (
    <GoogleProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleProvider>
  );
};

export default GoogleOAuthProvider;
