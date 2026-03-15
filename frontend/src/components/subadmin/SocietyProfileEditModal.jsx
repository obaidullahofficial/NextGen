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
    available_plots: [],
    price_range: '',
    contact_number: '',
    head_office_address: '',
    amenities: {
      gatedCommunity: false,
      security: false,
      electricity: false,
      waterSupply: false,
      parks: false,
      mosque: false,
      gym: false,
      swimmingPool: false,
      communityCenter: false,
      playground: false,
      hospital: false,
      school: false,
      shoppingCenter: false,
      restaurant: false,
      cctv: false,
      fireAlarm: false
    }
  });
  
  const [societyName, setSocietyName] = useState(''); // Store the original society name from registration

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [plotError, setPlotError] = useState('');
  
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
          available_plots: Array.isArray(result.profile.available_plots) 
            ? result.profile.available_plots 
            : [],
          price_range: result.profile.price_range || '',
          contact_number: result.profile.contact_number || '',
          head_office_address: result.profile.head_office_address || '',
          amenities: {
            gatedCommunity: result.profile.amenities?.includes('Gated Community') || false,
            security: result.profile.amenities?.includes('Security') || false,
            electricity: result.profile.amenities?.includes('Electricity') || false,
            waterSupply: result.profile.amenities?.includes('Water Supply') || false,
            parks: result.profile.amenities?.includes('Parks') || false,
            mosque: result.profile.amenities?.includes('Mosque') || false,
            gym: result.profile.amenities?.includes('Gym') || false,
            swimmingPool: result.profile.amenities?.includes('Swimming Pool') || false,
            communityCenter: result.profile.amenities?.includes('Community Center') || false,
            playground: result.profile.amenities?.includes('Playground') || false,
            hospital: result.profile.amenities?.includes('Hospital') || false,
            school: result.profile.amenities?.includes('School') || false,
            shoppingCenter: result.profile.amenities?.includes('Shopping Center') || false,
            restaurant: result.profile.amenities?.includes('Restaurant') || false,
            cctv: result.profile.amenities?.includes('CCTV') || false,
            fireAlarm: result.profile.amenities?.includes('Fire Alarm') || false
          }
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
    
    // Validate phone number for Pakistan
    if (field === 'contact_number') {
      validatePakistanPhone(value);
    }
  };

  const validatePakistanPhone = (phone) => {
    if (!phone || phone.length === 0) {
      setPhoneError('');
      return true;
    }
    
    // Remove all spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    
    // Pakistani phone number patterns:
    // +92XXXXXXXXXX (13 digits with +92)
    // 92XXXXXXXXXX (12 digits starting with 92)
    // 03XXXXXXXXX (11 digits starting with 0)
    const patterns = [
      /^\+92[0-9]{10}$/, // +92XXXXXXXXXX
      /^92[0-9]{10}$/, // 92XXXXXXXXXX
      /^0[0-9]{10}$/ // 0XXXXXXXXXX
    ];
    
    const isValid = patterns.some(pattern => pattern.test(cleaned));
    
    if (!isValid) {
      if (cleaned.length < 10) {
        setPhoneError('Invalid format or length (too short)');
      } else if (cleaned.length > 13) {
        setPhoneError('Invalid format or length (too long)');
      } else {
        setPhoneError('Invalid format');
      }
    } else {
      setPhoneError('');
    }
    
    return isValid;
  };

  const handleAmenityChange = (amenity) => {
    setProfile(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity]
      }
    }));
  };

  const handlePlotSizeChange = (plotSize) => {
    setProfile(prev => {
      const currentPlots = prev.available_plots;
      if (currentPlots.includes(plotSize)) {
        return {
          ...prev,
          available_plots: currentPlots.filter(p => p !== plotSize)
        };
      } else {
        setPlotError(''); // Clear error when selecting a plot
        return {
          ...prev,
          available_plots: [...currentPlots, plotSize]
        };
      }
    });
  };

  const getSelectedAmenities = () => {
    const amenityMap = {
      gatedCommunity: "Gated Community",
      security: "Security",
      electricity: "Electricity",
      waterSupply: "Water Supply",
      parks: "Parks",
      mosque: "Mosque",
      gym: "Gym",
      swimmingPool: "Swimming Pool",
      communityCenter: "Community Center",
      playground: "Playground",
      hospital: "Hospital",
      school: "School",
      shoppingCenter: "Shopping Center",
      restaurant: "Restaurant",
      cctv: "CCTV",
      fireAlarm: "Fire Alarm"
    };
    
    return Object.entries(profile.amenities)
      .filter(([key, value]) => value)
      .map(([key]) => amenityMap[key]);
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
      const requiredFields = ['name', 'description', 'price_range', 'contact_number', 'head_office_address'];
      for (let field of requiredFields) {
        if (!profile[field].trim()) {
          setMessage(`Please fill in ${field.replace('_', ' ')}`);
          setLoading(false);
          return;
        }
      }
      
      // Check if at least one plot size is selected
      if (!profile.available_plots || profile.available_plots.length === 0) {
        setMessage('Please select at least one plot size');
        setPlotError('Please select at least one plot size');
        setLoading(false);
        return;
      }
      
      setPlotError(''); // Clear error if validation passes
      
      // Validate Pakistani phone number
      if (!validatePakistanPhone(profile.contact_number)) {
        setMessage('Please enter a valid Pakistani phone number');
        setLoading(false);
        return;
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
        } else if (key === 'amenities') {
          // Handle amenities as array
          const selectedAmenities = getSelectedAmenities();
          if (selectedAmenities.length > 0) {
            formData.append('amenities[]', '');
            selectedAmenities.forEach((amenity, index) => {
              formData.append(`amenities[${index}]`, amenity);
            });
          }
        } else if (key === 'available_plots') {
          // Handle available_plots as array
          if (profile.available_plots.length > 0) {
            formData.append('available_plots[]', '');
            profile.available_plots.forEach((plotSize, index) => {
              formData.append(`available_plots[${index}]`, plotSize);
            });
          }
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
                            ðŸ’¡ This name was registered during approval and cannot be modified for security reasons.
                          </p>
                        </div>

                        {/* Location */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#2F3D57] mb-2">
                            <FiMapPin className="w-4 h-4" />
                            Location
                          </label>
                          <input
                            type="text"
                            value={profile.location}
                            disabled
                            readOnly
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                            placeholder="e.g. Lahore, Karachi, Islamabad"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            ðŸ’¡ This location is from your approved registration and cannot be changed.
                          </p>
                        </div>

                        {/* Available Plots */}
                        <div className="md:col-span-2">
                          <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${
                            plotError ? 'text-red-600' : 'text-[#2F3D57]'
                          }`}>
                            <FiHome className="w-4 h-4" />
                            Available Plots *
                          </label>
                          <div className={`border-2 rounded-lg p-4 ${
                            plotError ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                '5 Marla', '6 Marla', '7 Marla', '8 Marla', '9 Marla', '10 Marla',
                                '11 Marla', '12 Marla', '13 Marla', '14 Marla', '15 Marla', '16 Marla',
                                '17 Marla', '18 Marla', '19 Marla', '20 Marla (1 Kanal)'
                              ].map((plotSize) => (
                                <div
                                  key={plotSize}
                                  onClick={() => handlePlotSizeChange(plotSize)}
                                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    profile.available_plots.includes(plotSize)
                                      ? 'border-[#ED7600] bg-orange-50'
                                      : 'border-gray-300 bg-white hover:border-[#ED7600] hover:bg-orange-50'
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      profile.available_plots.includes(plotSize)
                                        ? 'border-[#ED7600] bg-[#ED7600]'
                                        : 'border-gray-300 bg-white'
                                    }`}
                                  >
                                    {profile.available_plots.includes(plotSize) && (
                                      <span className="text-white text-sm font-bold">âœ“</span>
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-[#2F3D57]">{plotSize}</span>
                                </div>
                              ))}
                            </div>
                            {profile.available_plots.length > 0 && (
                              <p className="text-xs text-gray-600 mt-3 italic">
                                Selected: {profile.available_plots.join(', ')}
                              </p>
                            )}
                            {plotError && (
                              <p className="text-xs text-red-600 mt-3 font-medium">
                                {plotError}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price Range */}
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#2F3D57] mb-2">
                            <FaCoins className="w-4 h-4" />
                            Price Range *
                          </label>
                          <select
                            value={profile.price_range}
                            onChange={(e) => handleInputChange('price_range', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200"
                            style={{ height: '48px' }}
                            required
                          >
                            <option value="">Select price range</option>
                            <option value="5 Lakh - 10 Lakh">PKR 5 Lakh - 10 Lakh</option>
                            <option value="10 Lakh - 20 Lakh">PKR 10 Lakh - 20 Lakh</option>
                            <option value="20 Lakh - 30 Lakh">PKR 20 Lakh - 30 Lakh</option>
                            <option value="30 Lakh - 50 Lakh">PKR 30 Lakh - 50 Lakh</option>
                            <option value="50 Lakh - 75 Lakh">PKR 50 Lakh - 75 Lakh</option>
                            <option value="75 Lakh - 1 Crore">PKR 75 Lakh - 1 Crore</option>
                            <option value="1 Crore - 1.5 Crore">PKR 1 Crore - 1.5 Crore</option>
                            <option value="1.5 Crore - 2 Crore">PKR 1.5 Crore - 2 Crore</option>
                            <option value="2 Crore - 3 Crore">PKR 2 Crore - 3 Crore</option>
                            <option value="3 Crore - 5 Crore">PKR 3 Crore - 5 Crore</option>
                            <option value="5 Crore - 10 Crore">PKR 5 Crore - 10 Crore</option>
                            <option value="10 Crore+">PKR 10 Crore+</option>
                          </select>
                        </div>

                        {/* Contact Number */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#2F3D57] mb-2">
                            <FiUser className="w-4 h-4" />
                            Phone Number *
                          </label>
                          <div className="relative">
                            <div className="absolute left-0 top-0 h-full flex items-center pl-4 border-r border-gray-300 z-10">
                              <img 
                                src="https://flagcdn.com/w40/pk.png" 
                                alt="PK" 
                                className="w-6 h-4 object-cover mr-1"
                              />
                              <span className="text-gray-600 mr-3 font-medium">+92</span>
                            </div>
                            <input
                              type="text"
                              value={profile.contact_number}
                              onChange={(e) => handleInputChange('contact_number', e.target.value)}
                              className={`w-full pl-28 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200 ${
                                phoneError ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="XXX-XXXXXXX"
                              required
                            />
                          </div>
                          {phoneError && (
                            <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                          )}
                        </div>

                        {/* Head Office Address */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-[#2F3D57] mb-2">
                            <FiMapPin className="w-4 h-4" />
                            Head Office Address *
                          </label>
                          <input
                            type="text"
                            value={profile.head_office_address}
                            onChange={(e) => handleInputChange('head_office_address', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-transparent transition-all duration-200"
                            placeholder="e.g. Office #123, Building Name, City"
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

                      {/* Amenities Section */}
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-[#2F3D57] mb-4">Society Amenities</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { id: "gatedCommunity", label: "Gated Community" },
                            { id: "security", label: "Security" },
                            { id: "cctv", label: "CCTV" },
                            { id: "fireAlarm", label: "Fire Alarm" },
                            { id: "electricity", label: "Electricity" },
                            { id: "waterSupply", label: "Water Supply" },
                            { id: "parks", label: "Parks" },
                            { id: "playground", label: "Playground" },
                            { id: "mosque", label: "Mosque" },
                            { id: "gym", label: "Gym" },
                            { id: "swimmingPool", label: "Swimming Pool" },
                            { id: "communityCenter", label: "Community Center" },
                            { id: "hospital", label: "Hospital" },
                            { id: "school", label: "School" },
                            { id: "shoppingCenter", label: "Shopping Center" },
                            { id: "restaurant", label: "Restaurant" }
                          ].map((amenity) => (
                            <div
                              key={amenity.id}
                              onClick={() => handleAmenityChange(amenity.id)}
                              className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                                profile.amenities[amenity.id]
                                  ? 'border-[#ED7600] bg-orange-50'
                                  : 'border-gray-300 hover:border-[#ED7600] hover:bg-orange-50'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                                  profile.amenities[amenity.id]
                                    ? 'border-[#ED7600] bg-[#ED7600]'
                                    : 'border-gray-400'
                                }`}
                              >
                                {profile.amenities[amenity.id] && (
                                  <span className="text-white text-sm font-bold">âœ“</span>
                                )}
                              </div>
                              <span
                                className={`font-medium ${
                                  profile.amenities[amenity.id]
                                    ? 'text-[#ED7600]'
                                    : 'text-gray-700'
                                }`}
                              >
                                {amenity.label}
                              </span>
                            </div>
                          ))}
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
