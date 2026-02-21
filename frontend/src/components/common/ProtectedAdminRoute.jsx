import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
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

  // User is not admin - redirect to their appropriate dashboard
  if (user.role !== 'admin') {
    if (user.role === 'subadmin' || user.role === 'society') {
      return <Navigate to="/subadmin" replace />;
    }
    if (user.role === 'user') {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // User is admin - render protected content
  return children;
};

export default ProtectedAdminRoute;
