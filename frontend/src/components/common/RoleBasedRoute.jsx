import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Role-Based Access Control Route Component
 * Protects routes based on user roles and redirects unauthorized users
 */
const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
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

  // No user logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User logged in but role not allowed - redirect based on their actual role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/dashboard" replace />;
      case 'subadmin':
      case 'society': // Backend uses 'society' for subadmin role
        return <Navigate to="/subadmin" replace />;
      case 'user':
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // User has correct role - render the protected content
  return children;
};

export default RoleBasedRoute;
