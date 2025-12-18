import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protects routes that should only be accessible to regular users
 * Redirects admin and subadmin to their respective dashboards
 */
const UserOnlyRoute = ({ children }) => {
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

  // If user is admin, redirect to admin dashboard
  if (user && user.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is subadmin/society, redirect to subadmin dashboard
  if (user && (user.role === 'subadmin' || user.role === 'society')) {
    return <Navigate to="/subadmin" replace />;
  }

  // Allow access for regular users or non-logged-in users
  return children;
};

export default UserOnlyRoute;
