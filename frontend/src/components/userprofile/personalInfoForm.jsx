import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userProfileAPI, createProfileFormData } from '../../services/userProfileAPI';
import { useAuth } from '../../context/AuthContext';
import { FiShield, FiCheckCircle, FiClock, FiUser, FiMail, FiPhone, FiCreditCard, FiCamera } from 'react-icons/fi';

const PersonalInfoForm = () => {
  const navigate = useNavigate();
  const { updateUserProfile, user } = useAuth();
  const [form, setForm] = useState({
    cnic: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: user?.email || '',
    profileImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingProfile, setExistingProfile] = useState(null);

  // Load existing profile data
  useEffect(() => {
    loadProfile();
  }, []);
  
  // Set email from user context when available
  useEffect(() => {
    if (user?.email) {
      setForm(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const response = await userProfileAPI.getProfile();
      if (response.success && response.data) {
        const profileData = response.data;
        setExistingProfile(profileData);
        setForm(prev => ({
          ...prev,
          cnic: profileData.cnic || '',
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          // File URLs are displayed separately, not in form state
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Create FormData for API request
      const profileData = {
        firstName: form.firstName,
        lastName: form.lastName,
        cnic: form.cnic,
        phone: form.phone,
        email: form.email,
      };

      const files = {
        profileImage: form.profileImage,
      };

      const formData = createProfileFormData(profileData, files);
      
      const response = await userProfileAPI.updateProfile(formData);
      
      if (response.success) {
        console.log('[PROFILE UPDATE] Full response:', response);
        console.log('[PROFILE UPDATE] Response data:', response.data);
        console.log('[PROFILE UPDATE] All fields:', Object.keys(response.data));
        setMessage({ type: 'success', text: response.message });
        // Update AuthContext with new profile data
        if (response.data) {
          console.log('[PROFILE UPDATE] Updating context with:', {
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            profileImage: response.data.profile_image_url || response.data.profile_image,
            allData: response.data
          });
          updateUserProfile(response.data);
        }
        // Show success message briefly then redirect to home
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Top Right Verification Status */}
      {existingProfile && (
        <div className="absolute top-4 right-4 z-10">
          <div className={`bg-white rounded-lg shadow-lg border-l-4 p-3 max-w-xs ${ 
            existingProfile.is_verified 
              ? 'border-green-400' 
              : 'border-orange-400'
          }`}>
            <div className="flex items-start space-x-2">
              <div className={`p-1 rounded-full ${ 
                existingProfile.is_verified 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-orange-100 text-orange-600'
              }`}>
                {existingProfile.is_verified ? (
                  <FiCheckCircle className="w-4 h-4" />
                ) : (
                  <FiClock className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                  <FiShield className="w-3 h-3 mr-1" />
                  Account Verification Status
                </h4>
                <p className={`text-xs font-medium mt-1 ${ 
                  existingProfile.is_verified 
                    ? 'text-green-700' 
                    : 'text-orange-700'
                }`}>
                  {existingProfile.is_verified ? '✓ Verified Account' : '⏳ Pending Verification'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {existingProfile.is_verified 
                    ? 'Your account has been successfully verified and all features are available.'
                    : 'Your verification is in progress. Some features may be limited until verification is complete.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2F3D57] to-[#1e293b] rounded-2xl p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <FiUser className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Personal Information</h1>
                <p className="text-blue-200 text-sm mt-1">Manage your profile details and verification status</p>
              </div>
            </div>
          </div>

          {/* Success/Error Message */}
          {message.text && (
            <div className={`p-3 rounded-xl border-l-4 ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-400 text-green-700' 
                : 'bg-red-50 border-red-400 text-red-700'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <FiCheckCircle className="h-4 w-4" />
                  ) : (
                    <FiClock className="h-4 w-4" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="p-6 space-y-6">
              
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <FiUser className="w-4 h-4 mr-2 text-[#ED7600]" />
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <FiUser className="w-4 h-4 mr-2 text-[#ED7600]" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <FiPhone className="w-4 h-4 mr-2 text-[#ED7600]" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); 
                      if (value.length <= 11 && (value === '' || value.startsWith('0'))) {
                        setForm((prev) => ({ ...prev, phone: value }));
                      }
                    }}
                    maxLength={11}
                    pattern="^03[0-9]{9}$"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                    placeholder="03001234567"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 ml-1">Enter 11 digits starting with 03</p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <FiMail className="w-4 h-4 mr-2 text-[#ED7600]" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed transition-all duration-200"
                    title="Email cannot be changed. This is your login email."
                  />
                  <p className="text-xs text-gray-500 mt-1 ml-1">Login email (cannot be changed)</p>
                </div>
              </div>

          {/* Row 3: CNIC & Profile Photo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <FiCreditCard className="w-4 h-4 mr-2 text-[#ED7600]" />
                CNIC Number
              </label>
              <input
                type="text"
                name="cnic"
                value={form.cnic}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // remove non-digits
                  if (value.length <= 13) {
                    setForm((prev) => ({ ...prev, cnic: value }));
                  }
                }}
                maxLength={13}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                placeholder="13-digit CNIC without dashes"
                required
              />
              <p className="text-xs text-gray-500 mt-2 ml-1">Enter 13 digits without dashes</p>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <FiCamera className="w-4 h-4 mr-2 text-[#ED7600]" />
                Profile Photo
              </label>
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200 shadow-md">
                    {form.profileImage ? (
                      <img
                        src={URL.createObjectURL(form.profileImage)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : existingProfile?.profile_image_url ? (
                      <img
                        src={`http://localhost:5000/api/file/${existingProfile.profile_image_url.replace(/^\//, '')}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <FiUser className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                </div>
                <label className="cursor-pointer bg-gradient-to-r from-[#ED7600] to-[#f59e0b] hover:from-[#D56900] hover:to-[#ea580c] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FiCamera className="w-4 h-4 inline mr-2" />
                  {existingProfile?.profile_image_url ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    name="profileImage"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        profileImage: e.target.files[0],
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          </div>
              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-gradient-to-r from-[#ED7600] to-[#f59e0b] hover:from-[#D56900] hover:to-[#ea580c] text-white hover:shadow-xl'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
