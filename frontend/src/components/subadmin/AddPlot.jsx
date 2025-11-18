import React, { useState } from "react";
import { FiPhone } from "react-icons/fi";
import AlertModal from '../common/AlertModal';
import { useAlert } from '../../hooks/useAlert';

const AddPlotForm = ({ onSubmit, onCancel}) => {
  const [form, setForm] = useState({
    plotId: "",
    plot_number: "", // New field for plot number
    price: "",
    status: "Available",
    type: "Residential",
    area: "",
    dimension_x: "",
    dimension_y: "",
    location: "",
    description: [""],
    contactName: "",
    contactPhone: "",
    images: [], // New field for storing images
    amenities: {
      gatedCommunity: false,
      security: false,
      electricity: false,
      waterSupply: false,
      parks: false,
      mosque: false
    }
  });

  const [imagePreviews, setImagePreviews] = useState([]); // For displaying previews
  const [plotImage, setPlotImage] = useState(null); // For storing single image file
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission
  const [imageError, setImageError] = useState(false); // Track image validation error
  const [phoneError, setPhoneError] = useState('');
  const [plotNumberError, setPlotNumberError] = useState('');
  const { alertState, showError, showWarning, showSuccess } = useAlert();

  const areaOptions = ["5 Marla", "7 Marla", "10 Marla", "1 Kanal"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation and formatting
    if (name === 'contactPhone') {
      // Remove all non-digit characters
      const cleaned = value.replace(/\D/g, '');
      
      // Limit to 10 digits
      const limited = cleaned.substring(0, 10);
      
      // Format with dashes: XXX-XXXXXXX
      let formatted = limited;
      if (limited.length > 3) {
        formatted = limited.substring(0, 3) + '-' + limited.substring(3);
      }
      
      // Validate phone number length
      if (limited.length > 0 && limited.length < 10) {
        setPhoneError('Phone number must be 10 digits');
      } else if (limited.length === 10) {
        setPhoneError('');
      } else if (limited.length === 0) {
        setPhoneError('');
      }
      
      setForm({ ...form, [name]: formatted });
    }
    // Plot number validation - only numbers allowed
    else if (name === 'plot_number') {
      // Remove all non-digit characters
      const cleaned = value.replace(/\D/g, '');
      
      if (value !== '' && value !== cleaned) {
        setPlotNumberError('Plot number must contain only digits');
      } else {
        setPlotNumberError('');
      }
      
      setForm({ ...form, [name]: cleaned });
    }
    else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleDescriptionChange = (index, value) => {
    const newDescription = [...form.description];
    newDescription[index] = value;
    setForm({ ...form, description: newDescription });
  };

  const addDescriptionItem = () => {
    setForm({ ...form, description: [...form.description, ""] });
  };

  const removeDescriptionItem = (index) => {
    const newDescription = form.description.filter((_, i) => i !== index);
    setForm({ ...form, description: newDescription });
  };

  const handleAmenityChange = (amenity) => {
    setForm({
      ...form,
      amenities: {
        ...form.amenities,
        [amenity]: !form.amenities[amenity]
      }
    });
  };

  // Handle plot image selection (similar to society profile)
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    console.log('File selected:', file);
    
    if (file) {
      // Clear image error when user uploads an image
      setImageError(false);
      // Validate image format (PNG, JPG, JPEG)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        showError('Invalid Image Format', 'Please select a PNG, JPG, or JPEG file for the plot image.');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('File Size Too Large', 'Plot image file size must be less than 5MB.');
        return;
      }
      
      console.log('Setting plot image:', file.name);
      setPlotImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('FileReader loaded, setting preview');
        const dataUrl = e.target.result;
        console.log('Data URL length:', dataUrl.length);
        setImagePreviews([dataUrl]);
      };
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
    }
  };

  const removeImage = () => {
    setPlotImage(null);
    setImagePreviews([]);
  };

  // Helper to convert amenities object to array of human-readable enabled amenities
  const getSelectedAmenities = (amenitiesObj) => {
    const amenityMap = {
      gatedCommunity: "Gated Community",
      security: "Security",
      electricity: "Electricity",
      waterSupply: "Water Supply",
      parks: "Parks",
      mosque: "Mosque"
    };
    
    return Object.entries(amenitiesObj)
      .filter((entry) => entry[1]) // Only include true values
      .map(([key]) => amenityMap[key] || key); // Use human-readable name if available
  };

  // API integration for Add Plot using FormData (like society profile)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('[AddPlot] Submission already in progress, ignoring duplicate request');
      return;
    }
    
    setLoading(true);
    setIsSubmitting(true);

    try {
      // Simple validation - reset states immediately on validation failure
      const requiredFields = ['plot_number', 'price', 'area', 'dimension_x', 'dimension_y', 'location', 'contactName', 'contactPhone'];
      for (let field of requiredFields) {
        if (!form[field] || form[field].toString().trim() === '') {
          // Reset states before showing alert so button becomes available again after user clicks OK
          setLoading(false);
          setIsSubmitting(false);
          await showWarning('Missing Information', `Please fill in ${field.replace('_', ' ')}.`);
          return;
        }
      }
      
      // Validate phone number before submission
      if (phoneError) {
        setLoading(false);
        setIsSubmitting(false);
        await showWarning('Validation Error', 'Please enter a valid phone number (10 digits required)');
        return;
      }

      // Check if phone number has correct length
      const phoneDigits = form.contactPhone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        setLoading(false);
        setIsSubmitting(false);
        await showWarning('Validation Error', 'Phone number must be exactly 10 digits');
        return;
      }
      
      // Validate plot number
      if (plotNumberError) {
        setLoading(false);
        setIsSubmitting(false);
        await showWarning('Validation Error', 'Plot number must contain only digits');
        return;
      }
      
      // Image is mandatory
      if (!plotImage) {
        // Show red border validation instead of alert
        setImageError(true);
        setLoading(false);
        setIsSubmitting(false);
        return;
      }
      
      // Clear image error if validation passes
      setImageError(false);
      
      // Create FormData like society profile
      const formData = new FormData();
      formData.append('plot_number', form.plot_number);
      formData.append('price', form.price);
      formData.append('status', form.status);
      formData.append('type', form.type);
      formData.append('area', form.area);
      formData.append('dimension_x', form.dimension_x);  // Send as string, backend will convert to int
      formData.append('dimension_y', form.dimension_y);  // Send as string, backend will convert to int
      formData.append('location', form.location);
      
      // Add description array - ensure we append description[] array
      const descriptions = form.description.filter(d => d.trim() !== '');
      
      // First, append empty array marker for Flask to detect
      if (descriptions.length > 0) {
        formData.append('description[]', ''); 
      }
      
      // Then append each description item with index
      descriptions.forEach((desc, index) => {
        formData.append(`description[${index}]`, desc);
      });
      
      // Add seller info with country code prefix to phone
      formData.append('seller[name]', form.contactName);
      formData.append('seller[phone]', '+92' + phoneDigits);
      
      // Add amenities - ensure we append amenities[] array
      const amenities = getSelectedAmenities(form.amenities);
      
      // First, append empty array marker for Flask to detect
      if (amenities.length > 0) {
        formData.append('amenities[]', '');
      }
      
      // Then append each amenity with index
      amenities.forEach((amenity, index) => {
        formData.append(`amenities[${index}]`, amenity);
      });
      
      // Add plot image (matching backend expectation)
      if (plotImage) {
        console.log('[AddPlot] Adding plot image to FormData:', plotImage.name, plotImage.type, plotImage.size);
        formData.append('plot_image', plotImage);
      }
      
      // Debug: Log what's being sent
      console.log('[AddPlot] FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      }
      
      // Additional validation debug
      console.log('[AddPlot] Pre-submission validation:', {
        hasPlotImage: !!plotImage,
        imageFileName: plotImage?.name,
        imageFileSize: plotImage?.size,
        imageFileType: plotImage?.type,
        formDataSize: Array.from(formData.entries()).length
      });
      
      const result = await onSubmit(formData); // Use parent's handler with FormData
      
      if (result !== false) { // If parent handler succeeds
        // Show success message and wait for user acknowledgment
        await showSuccess('Success!', 'Plot added successfully!');
        // After user clicks OK, reset form and close modal
        setForm({
          plotId: "",
          plot_number: "",
          price: "",
          status: "Available",
          type: "Residential",
          area: "",
          dimension_x: "",
          dimension_y: "",
          location: "",
          description: [""],
          contactName: "",
          contactPhone: "",
          images: [],
          amenities: {
            gatedCommunity: false,
            security: false,
            electricity: false,
            waterSupply: false,
            parks: false,
            mosque: false
          }
        });
        setPlotImage(null);
        setImagePreviews([]);
        
        if (onCancel) onCancel(); // Close the form
      }
      
    } catch (error) {
      console.error('Error creating plot:', error);
      await showError('Error Creating Plot', error.message || 'An unexpected error occurred while creating the plot.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-6xl mx-auto min-h-95vh">
      <h2 className="text-2xl font-bold text-[#2F3D57] mb-6">Add New Plot</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plot Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="plot_number"
                value={form.plot_number}
                onChange={handleChange}
                placeholder="e.g., 123"
                className={`w-full border ${plotNumberError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent`}
                required
              />
              {plotNumberError && (
                <p className="text-red-500 text-xs mt-1">{plotNumberError}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">Numbers only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="text"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                >
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  name="type"
                  value="Residential"
                  readOnly
                  className="w-full border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area <span className="text-red-600">*</span>
                </label>
                <select
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                  required
                >
                  <option value="">Select Area</option>
                  {areaOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimension X (ft)</label>
                <input
                  type="number"
                  name="dimension_x"
                  value={form.dimension_x}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimension Y (ft)</label>
                <input
                  type="number"
                  name="dimension_y"
                  value={form.dimension_y}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="space-y-2">
                {form.description.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="mr-2">•</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeDescriptionItem(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDescriptionItem}
                  className="mt-2 text-[#ED7600] hover:text-[#D56900] text-sm flex items-center"
                >
                  + Add another description point
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-md border-r-0">
                  <span className="text-lg">🇵🇰</span>
                  <span className="font-semibold text-gray-700">+92</span>
                </div>
                <input
                  type="text"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleChange}
                  placeholder="3XX-XXXXXXX"
                  className={`flex-1 border ${phoneError ? 'border-red-500' : 'border-gray-300'} rounded-r-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent`}
                  required
                />
              </div>
              {phoneError && (
                <p className="text-red-500 text-xs mt-1">{phoneError}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">Enter 10 digits (e.g., 300-1234567)</p>
            </div>

            {/* Image Upload Section - Society Profile Style */}
            <div className={`${imageError ? 'border-2 border-red-500 rounded-lg p-4 bg-red-50' : ''}`}>
              <label className={`block mb-3 text-lg font-semibold border-b-2 pb-2 ${
                imageError ? 'text-red-600 border-red-500' : 'text-gray-700 border-[#ED7600]'
              }`}>
                Plot Image <span className="text-red-600">*</span>
                {imageError && (
                  <span className="block text-sm font-normal text-red-600 mt-1">
                    Image upload is required. Please upload a plot image.
                  </span>
                )}
              </label>
              
              {/* Upload button */}
              <div className="mb-4">
                <input
                  accept="image/png,image/jpeg,image/jpg"
                  style={{ display: 'none' }}
                  id="plot-image-upload"
                  type="file"
                  onChange={handleImageUpload}
                />
                <label htmlFor="plot-image-upload">
                  <button
                    type="button"
                    className="px-4 py-2 border-2 border-[#ED7600] text-[#ED7600] rounded-md hover:bg-[#ED7600] hover:text-white transition-colors mr-2"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('plot-image-upload').click();
                    }}
                  >
                    {imagePreviews.length > 0 ? 'Change Image' : 'Upload Image'} (PNG/JPG)
                  </button>
                </label>
                <span className="text-xs text-gray-500 ml-2">
                  PNG, JPG, or JPEG format (max 5MB) - <strong className="text-red-600">Required</strong>
                </span>
              </div>
              
              {/* Image preview in society profile view format */}
              {imagePreviews.length > 0 ? (
                <div className="text-center">
                  <div className="mb-2 text-sm text-green-600">✓ Current Image</div>
                  <img
                    src={imagePreviews[0]}
                    alt="Plot Preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                    onLoad={() => console.log('Image loaded successfully')}
                    onError={(e) => {
                      console.error('Image load error:', e);
                      console.error('Image src:', imagePreviews[0]);
                    }}
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    {plotImage ? plotImage.name : 'Current Image'}
                  </p>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded">
                  <p className="text-gray-500">No image selected</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Upload Image" to add a plot image</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Amenities Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "gatedCommunity", label: "Gated Community" },
              { id: "security", label: "24/7 Security" },
              { id: "electricity", label: "Underground Electricity" },
              { id: "waterSupply", label: "Water Supply" },
              { id: "parks", label: "Green Parks" },
              { id: "mosque", label: "Mosque Nearby" }
            ].map((amenity) => (
              <label key={amenity.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.amenities[amenity.id]}
                  onChange={() => handleAmenityChange(amenity.id)}
                  className="mr-2 text-[#ED7600] focus:ring-[#ED7600]"
                />
                <span>{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-500" />
          <div className="space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className={`px-6 py-2 rounded-md ${
                isSubmitting || loading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#ED7600] text-white hover:bg-[#D56900]'
              }`}
            >
              {isSubmitting || loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Plot...
                </span>
              ) : (
                'Add Plot'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
    
    {/* Custom Alert Modal */}
    <AlertModal
      isOpen={alertState.isOpen}
      onClose={alertState.onClose}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
    />
    </>
  );
};

export default AddPlotForm;