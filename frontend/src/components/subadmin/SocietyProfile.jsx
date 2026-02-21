import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocietyProfile } from '../../services/apiService';
import { FiMapPin, FiHome, FiDollarSign, FiEdit2, FiCheckCircle, FiAlertCircle, FiBuilding, FiClock } from 'react-icons/fi';

const SocietyProfile = () => {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setMessage('Please log in to access this page');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      const result = await getSocietyProfile();
      
      if (result.success && result.profile) {
        setProfile(result.profile);
      } else if (result.error && result.error.includes('Profile not found')) {
        setMessage('No profile found. Please set up your profile first.');
      } else {
        setMessage(result.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error.message.includes('Authentication')) {
        setMessage('Session expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage('Error loading profile: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigate('/society-profile-setup');
  };

  const handleSetupProfile = () => {
    navigate('/society-profile-setup');
  };

  const isProfileComplete = () => {
    if (!profile) return false;
    const requiredFields = ['name', 'description', 'location', 'available_plots', 'price_range'];
    const hasAllFields = requiredFields.every(field => profile[field]);
    const hasLogo = profile.society_logo;
    return hasAllFields && hasLogo;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-300 h-16 w-16"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          </div>
          <div className="text-center mt-6 text-[#2F3D57] font-medium">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 animate-slideUp">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover-lift">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#2F3D57] mb-2">Society Profile</h1>
                <p className="text-gray-600 text-sm sm:text-base">Manage your society information and settings</p>
              </div>
              <button
                onClick={handleEditProfile}
                className="bg-[#ED7600] hover:bg-[#d65c00] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover-glow w-full sm:w-auto justify-center"
              >
                <FiEdit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5" />
              {message}
            </div>
          </div>
        )}

        {profile ? (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Logo Section */}
            <div className="lg:col-span-1 animate-slideUp" style={{animationDelay: '0.1s'}}>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 hover-lift">
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-[#2F3D57] mb-4 sm:mb-6">Society Logo</h3>
                  
                  <div className="relative inline-block mb-4">
                    {profile.society_logo ? (
                      <div className="relative">
                        <img
                          src={profile.society_logo}
                          alt="Society Logo"
                          className="w-40 h-40 rounded-full object-cover border-4 border-[#ED7600] shadow-xl"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full">
                          <FiCheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-40 h-40 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <FiBuilding className="w-16 h-16 text-gray-400" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 p-2 rounded-full">
                          <FiAlertCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    isProfileComplete() 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {isProfileComplete() ? (
                      <>
                        <FiCheckCircle className="w-4 h-4" />
                        Profile Complete
                      </>
                    ) : (
                      <>
                        <FiAlertCircle className="w-4 h-4" />
                        Profile Incomplete
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Profile Details */}
            <div className="lg:col-span-2 animate-slideUp" style={{animationDelay: '0.2s'}}>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8 hover-lift">
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                  
                  {/* Society Name */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-[#ED7600]/10 rounded-lg hover:bg-[#ED7600]/20 transition-colors duration-200">
                        <FiBuilding className="w-4 h-4 sm:w-5 sm:h-5 text-[#ED7600]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-[#2F3D57]">Society Name</h3>
                        <span className="text-xs text-gray-500">From Registration (Cannot be changed)</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                        <FiCheckCircle className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-700 font-medium">Verified</span>
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 ml-8 sm:ml-10">
                      {profile.name || (
                        <span className="text-gray-400 text-base sm:text-lg font-normal">Not specified</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 ml-8 sm:ml-10 mt-1">
                      💡 This name is locked from your approved registration and ensures security.
                    </p>
                  </div>
                  
                  {/* Location */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                        <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-[#2F3D57]">Location</h3>
                    </div>
                    <p className="text-gray-700 ml-8 sm:ml-10 font-medium text-sm sm:text-base">
                      {profile.location || (
                        <span className="text-gray-400 font-normal">Not specified</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Available Plots */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <FiHome className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#2F3D57]">Available Plots</h3>
                    </div>
                    <p className="text-gray-700 ml-10 font-medium">
                      {profile.available_plots || (
                        <span className="text-gray-400 font-normal">Not specified</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Price Range */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <FiDollarSign className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#2F3D57]">Price Range</h3>
                    </div>
                    <p className="text-gray-700 ml-10 font-medium">
                      {profile.price_range || (
                        <span className="text-gray-400 font-normal">Not specified</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Description */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <FiEdit2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#2F3D57]">Description</h3>
                    </div>
                    <p className="text-gray-700 ml-10 leading-relaxed">
                      {profile.description || (
                        <span className="text-gray-400">No description provided</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Last Updated */}
                  {profile.updated_at && (
                    <div className="md:col-span-2 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FiClock className="w-4 h-4" />
                        Last updated: {new Date(profile.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
        /* No Profile State */
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12 text-center animate-slideUp">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 hover:bg-gray-200 transition-colors duration-200">
                <FiBuilding className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2F3D57] mb-4">No Profile Found</h2>
              <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                Set up your society profile to get started with managing your properties and showcase your community to potential buyers.
              </p>
              <button
                onClick={handleSetupProfile}
                className="bg-gradient-to-r from-[#2F3D57] to-[#ED7600] hover:from-[#1a2332] hover:to-[#d65c00] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover-glow w-full sm:w-auto"
              >
                Set Up Profile
              </button>
            </div>
          </div>
        )}
        
        {/* Incomplete Profile Warning */}
        {profile && !isProfileComplete() && (
          <div className="mt-6 sm:mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6 animate-slideUp hover-lift" style={{animationDelay: '0.3s'}}>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <FiAlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">Profile Incomplete</h3>
                <p className="text-yellow-700 mb-4 text-sm sm:text-base leading-relaxed">
                  Your profile is missing some important information. Please update all required fields and upload a logo to access all features and make your society more attractive to potential buyers.
                </p>
                <button
                  onClick={handleEditProfile}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocietyProfile;
