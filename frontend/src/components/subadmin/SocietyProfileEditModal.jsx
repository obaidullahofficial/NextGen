import React, { useState, useEffect } from 'react';
import { getSocietyProfile, updateSocietyProfile } from '../../services/apiService';
import PopupModal from '../common/PopupModal';
import { FiX, FiUpload, FiImage, FiUser, FiMapPin, FiHome, FiEdit2, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';

const SocietyProfileEditModal = ({ isOpen, onClose, onSuccess }) => {
  const [profile, setProfile] = useState({
    name: '',
    description: '',
    location: '',
    available_plots: '',
    price_range: ''
  });
  
  const [societyName, setSocietyName] = useState(''); // Store the original society name from registration

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(false);
  
  // Popup modal state
  const [popup, setPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      setInitialLoading(true);
      console.log('[PROFILE EDIT MODAL] Loading existing profile for editing...');
      
      const result = await getSocietyProfile();
      console.log('[PROFILE EDIT MODAL] Profile data loaded:', result);
      
      if (result.success && result.profile) {
        // Store the original society name from registration (this should be read-only)
        const originalSocietyName = result.profile.name || '';
        setSocietyName(originalSocietyName);
        
        setProfile({
          name: originalSocietyName, // Use original name from registration
          description: result.profile.description || '',
          location: result.profile.location || '',
          available_plots: result.profile.available_plots || '',
          price_range: result.profile.price_range || ''
        });
        
        // Set logo if exists
        if (result.profile.society_logo) {
          setLogoPreview(result.profile.society_logo);
        }
        
        console.log('[PROFILE EDIT MODAL] Profile data set for editing');
      } else {
        setMessage('Failed to load profile data for editing');
        showPopup(
          'Error',
          'Could not load your profile data. Please try again.',
          'error'
        );
      }
    } catch (error) {
      console.error('[PROFILE EDIT MODAL] Error loading profile:', error);
      setMessage('Failed to load profile data: ' + error.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle logo file selection
  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate image format (PNG, JPG, JPEG)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setMessage('Please select a PNG, JPG, or JPEG file for the logo');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Logo file size must be less than 5MB');
        return;
      }
      
      setLogo(file);
      setMessage(''); // Clear any previous errors
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Show popup modal
  const showPopup = (title, message, type = 'info') => {
    setPopup({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Close popup modal
  const closePopup = () => {
    setPopup({
      isOpen: false,
      title: '',
      message: '',
      type: 'info'
    });
  };

  // Handle cancel - close modal
  const handleCancel = () => {
    console.log('[PROFILE EDIT MODAL] User cancelled editing');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('[PROFILE EDIT MODAL] Submitting profile updates...');
      
      // Simple validation
      const requiredFields = ['name', 'description', 'location', 'available_plots', 'price_range'];
      for (let field of requiredFields) {
        if (!profile[field].trim()) {
          setMessage(`Please fill in ${field.replace('_', ' ')}`);
          setLoading(false);
          return;
        }
      }
      
      if (!logo && !logoPreview) {
        setMessage('Please upload a logo');
        setLoading(false);
        return;
      }
      
      // Create FormData
      const formData = new FormData();
      Object.keys(profile).forEach(key => {
        if (key === 'name') {
          // Always use the original society name from registration
          formData.append(key, societyName || profile[key]);
        } else {
          formData.append(key, profile[key]);
        }
      });
      
      if (logo) {
        formData.append('society_logo', logo);
      }
      
      const result = await updateSocietyProfile(formData);
      
      console.log('[PROFILE EDIT MODAL] Update response:', {
        success: result.success,
        is_complete: result.is_complete,
        message: result.message,
        error: result.error
      });
      
      if (result.success) {
        console.log('[PROFILE EDIT MODAL] Profile updated successfully');
        
        showPopup(
          'Profile Updated!',
          'Your society profile has been updated successfully.',
          'success'
        );
        
        // Close modal and refresh parent component after success
        setTimeout(() => {
          closePopup();
          onClose();
          if (onSuccess) onSuccess();
        }, 2000);
        
      } else {
        setMessage(result.error || 'Failed to update profile');
      }
      
    } catch (error) {
      console.error('[PROFILE EDIT MODAL] Update error:', error);
      if (error.message.includes('Authentication')) {
        setMessage('Session expired. Please log in again.');
      } else {
        setMessage(error.message || 'Update failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modern Modal Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden animate-slideUp">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Edit Society Profile</h2>
                <p className="text-white/90">Update your society information below</p>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                disabled={loading}
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(95vh-120px)] overflow-y-auto">
            {initialLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-[#ED7600] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-[#2F3D57] font-semibold">Loading profile for editing...</p>
              </div>
            ) : (
              <>
                {/* Error Message */}
                {message && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                    {message}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Left Side - Logo Upload Section */}
                    <div className="lg:col-span-1">
                      <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <div className="flex items-center gap-2 justify-center mb-4">
                          <FiImage className="w-5 h-5 text-[#2F3D57]" />
                          <h3 className="text-lg font-semibold text-[#2F3D57]">Society Logo</h3>
                        </div>
                        
                        {/* Upload Button */}
                        <div className="mb-4">
                          <input
                            accept="image/png,image/jpeg,image/jpg"
                            style={{ display: 'none' }}
                            id="logo-upload"
                            type="file"
                            onChange={handleLogoChange}
                          />
                          <label htmlFor="logo-upload">
                            <button
                              type="button"
                              className="w-full bg-[#ED7600] hover:bg-[#d65c00] text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('logo-upload').click();
                              }}
                            >
                              <FiUpload className="w-4 h-4" />
                              {logoPreview ? 'Change Logo' : 'Upload Logo'}
                            </button>
                          </label>
                          <p className="text-sm text-gray-500 mt-2">
                            PNG, JPG, or JPEG format (max 5MB)
                          </p>
                        </div>
                        
                        {/* Logo Preview */}
                        {logoPreview && (
                          <div className="relative inline-block">
                            <img
                              src={logoPreview}
                              alt="Logo Preview"
                              className="w-32 h-32 object-cover border-4 border-[#ED7600] rounded-xl shadow-lg"
                            />
                            <div className="absolute -top-2 -right-2 bg-green-500 p-1 rounded-full">
                              <FiCheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              {logo ? 'New Logo Preview' : 'Current Logo'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Form Fields */}
                    <div className="lg:col-span-2">
                      <div className="grid md:grid-cols-2 gap-6">
                        
                        {/* Society Name - Read-only (hardcoded from registration) */}
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#2F3D57] mb-2">
                            <FiUser className="w-4 h-4" />
                            Society Name 
                            <span className="text-xs text-gray-500 font-normal">(From Registration - Cannot be changed)</span>
                          </label>
                          <input
                            type="text"
                            value={societyName || profile.name}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed transition-all duration-200"
                            placeholder="Society name from registration"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            💡 This name was registered during approval and cannot be modified for security reasons.
                          </p>
                        </div>

                        {/* Location */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#2F3D57] mb-2">
                            <FiMapPin className="w-4 h-4" />
                            Location *
                          </label>
                          <input
                            type="text"
                            value={profile.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200"
                            placeholder="e.g. Lahore, Karachi, Islamabad"
                            required
                          />
                        </div>

                        {/* Available Plots */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#2F3D57] mb-2">
                            <FiHome className="w-4 h-4" />
                            Available Plots *
                          </label>
                          <input
                            type="text"
                            value={profile.available_plots}
                            onChange={(e) => handleInputChange('available_plots', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200"
                            placeholder="e.g. 5 Marla, 10 Marla, 1 Kanal"
                            required
                          />
                        </div>

                        {/* Price Range */}
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#2F3D57] mb-2">
                            <FaCoins className="w-4 h-4" />
                            Price Range *
                          </label>
                          <input
                            type="text"
                            value={profile.price_range}
                            onChange={(e) => handleInputChange('price_range', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200"
                            placeholder="e.g. 50L - 1Cr"
                            required
                          />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#2F3D57] mb-2">
                            <FiEdit2 className="w-4 h-4" />
                            Description *
                          </label>
                          <textarea
                            value={profile.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200 resize-none"
                            placeholder="Describe your society, its features, and what makes it special..."
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] hover:from-[#1a2332] hover:to-[#d65c00] text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <FiLoader className="w-5 h-5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="w-5 h-5" />
                          Update Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      <PopupModal 
        isOpen={popup.isOpen}
        onClose={closePopup}
        title={popup.title}
        message={popup.message}
        type={popup.type}
      />
    </>
  );
};

export default SocietyProfileEditModal;
