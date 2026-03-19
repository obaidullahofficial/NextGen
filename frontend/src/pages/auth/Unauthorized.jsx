import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiHome, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Navigate to appropriate dashboard based on role
    switch (user.role) {
      case 'admin':
        navigate('/dashboard');
        break;
      case 'subadmin':
        navigate('/subadmin');
        break;
      case 'user':
        navigate('/');
        break;
      default:
        navigate('/login');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <FiAlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>
        
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. This area is restricted to specific user roles.
        </p>

        {user && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              You are logged in as: <span className="font-semibold text-blue-600 capitalize">{user.role}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 bg-[#ED7600] text-white px-6 py-3 rounded-lg hover:bg-[#D56900] transition-colors font-medium"
          >
            <FiHome className="w-5 h-5" />
            Go to Dashboard
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
