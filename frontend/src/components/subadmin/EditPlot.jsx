import React, { useState, useEffect } from "react";
import { FiPhone } from "react-icons/fi";
import AlertModal from '../common/AlertModal';
import { useAlert } from '../../hooks/useAlert';
import { getSocietyProfile } from '../../services/apiService';

// Hardcoded marla dimensions (in feet)
const MARLA_DIMENSIONS = {
  '5 Marla': { x: 30, y: 50 },
  '6 Marla': { x: 30, y: 60 },
  '7 Marla': { x: 35, y: 60 },
  '8 Marla': { x: 40, y: 60 },
  '9 Marla': { x: 45, y: 60 },
  '10 Marla': { x: 50, y: 60 },
  '11 Marla': { x: 44, y: 75 },
  '12 Marla': { x: 48, y: 75 },
  '13 Marla': { x: 52, y: 75 },
  '14 Marla': { x: 56, y: 75 },
  '15 Marla': { x: 60, y: 75 },
  '16 Marla': { x: 64, y: 75 },
  '17 Marla': { x: 68, y: 75 },
  '18 Marla': { x: 72, y: 75 },
  '19 Marla': { x: 76, y: 75 },
  '20 Marla (1 Kanal)': { x: 80, y: 75 }
};

const EditPlotForm = ({ plot, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    plot_number: "",
    price: "",
    status: "Available",
    type: "Residential",
    area: "",
    marla_size: "",
    dimension_x: "",
    dimension_y: "",
    description: [""],
    images: []
  });
  const [availablePlotSizes, setAvailablePlotSizes] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission
  const [imageError, setImageError] = useState(false); // Track image validation error
  const [plotNumberError, setPlotNumberError] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const { alertState, showError } = useAlert();

  // Fetch society profile to get available plot sizes first
  useEffect(() => {
    const fetchSocietyProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const result = await getSocietyProfile();
        if (result.success && result.profile && result.profile.available_plots) {
          setAvailablePlotSizes(result.profile.available_plots);
        }
      } catch (error) {
        console.error('Error fetching society profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchSocietyProfile();
  }, []);

  // Load plot data after profile is loaded
  useEffect(() => {
    if (plot && !isLoadingProfile) {
      console.log('EditPlot - FULL plot data received:', JSON.stringify(plot, null, 2));
      console.log('EditPlot - plot.image field:', plot.image);
      console.log('EditPlot - plot.images field:', plot.images);
      
      setForm({
        plot_number: plot.plot_number || "",
        price: plot.price || "",
        status: plot.status || "Available",
        type: plot.type || "Residential",
        area: plot.area || "",
        marla_size: plot.marla_size || "",
        dimension_x: plot.dimension_x || "",
        dimension_y: plot.dimension_y || "",
        description: Array.isArray(plot.description) ? plot.description : (plot.description ? [plot.description] : [""]),
        images: []
      });
      
      // Handle existing images with multiple URL patterns and better error handling
      let existingImages = [];
      
      console.log('EditPlot - Starting image processing...');
      console.log('EditPlot - Checking images array:', Array.isArray(plot.images), plot.images);
      console.log('EditPlot - Checking single image:', plot.image);
      
      // Function to generate multiple possible image URLs or handle base64
      const generateImageUrls = (imageData) => {
        // If it starts with data:, it's a base64 encoded image
        if (imageData.startsWith('data:')) {
          return [imageData]; // Return as-is for base64
        }
        
        if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
          return [imageData]; // Already a full URL
        }
        
        // Try multiple possible URL patterns for filename-based images
        return [
          `https://nextgen-ta95.onrender.com/uploads/${imageData}`,
          `https://nextgen-ta95.onrender.com/images/${imageData}`,
          `http://localhost:3000/uploads/${imageData}`,
          `http://localhost:8000/uploads/${imageData}`,
          `/uploads/${imageData}`, // Relative path
          `/images/${imageData}`, // Alternative relative path
          imageData // Raw filename as last resort
        ];
      };
      
      // Process images from various sources
      const imagesList = [];
      
      // Check single image field first (primary storage location)
      if (plot.image && plot.image.trim() !== '' && plot.image !== 'No images') {
        console.log('EditPlot - Processing single image:', plot.image.substring(0, 50) + '...');
        imagesList.push(plot.image);
      }
      // Also check for images array (legacy or additional images)
      else if (Array.isArray(plot.images) && plot.images.length > 0) {
        console.log('EditPlot - Processing images array:', plot.images);
        plot.images
          .filter(img => img && img.trim() !== '' && img !== 'No images')
          .forEach(img => imagesList.push(img));
      }
      
      // Generate all possible URLs for each image
      imagesList.forEach((imageData, index) => {
        const possibleUrls = generateImageUrls(imageData);
        console.log(`EditPlot - Image ${index} possible URLs:`, possibleUrls.length === 1 && possibleUrls[0].startsWith('data:') ? '[Base64 Data]' : possibleUrls);
        
        existingImages.push({
          originalName: imageData.startsWith('data:') ? 'Base64 Image' : imageData,
          urls: possibleUrls,
          currentUrl: possibleUrls[0],
          isBase64: imageData.startsWith('data:')
        });
      });
      
      console.log('EditPlot - Final existing images array:', existingImages);
      console.log('EditPlot - Setting image previews...');
      setImagePreviews(existingImages);
      
      // Test image loading for each URL pattern
      existingImages.forEach((imageData, index) => {
        console.log(`EditPlot - Testing URLs for image ${index}:`, imageData.urls);
        
        imageData.urls.forEach((url, urlIndex) => {
          const img = new Image();
          img.onload = () => {
            console.log(`EditPlot - Image ${index} URL ${urlIndex} loaded successfully:`, url);
            // Update the working URL
            if (imageData.currentUrl === imageData.urls[0] || !imageData.workingUrl) {
              imageData.workingUrl = url;
              // Force re-render if this is a better URL
              setImagePreviews(prev => [...prev]);
            }
          };
          img.onerror = () => {
            console.error(`EditPlot - Image ${index} URL ${urlIndex} failed to load:`, url);
          };
          img.src = url;
        });
      });
    }
  }, [plot, isLoadingProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Plot number validation - only numbers allowed
    if (name === 'plot_number') {
      // Remove all non-digit characters
      const cleaned = value.replace(/https://nextgen-ta95.onrender.com/apiD/g, '');
      
      if (value !== '' && value !== cleaned) {
        setPlotNumberError('Plot number must contain only digits');
      } else {
        setPlotNumberError('');
      }
      
      setForm({ ...form, [name]: cleaned });
    }
    // Auto-populate dimensions and calculate area when marla_size is selected
    else if (name === 'marla_size') {
      const dimensions = MARLA_DIMENSIONS[value];
      if (dimensions) {
        const area = dimensions.x * dimensions.y;
        setForm({ 
          ...form, 
          marla_size: value,
          dimension_x: dimensions.x.toString(),
          dimension_y: dimensions.y.toString(),
          area: `${area.toFixed(2)} sq ft`
        });
      } else {
        setForm({ ...form, [name]: value });
      }
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; // Take only the first file for single image approach
    if (file) {
      console.log('EditPlot - new file uploaded:', file.name);
      
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
      
      // Create object URL for new file preview
      const newFilePreview = URL.createObjectURL(file);
      
      // Replace all previews with the new single image (clear existing ones)
      setImagePreviews([newFilePreview]);
      
      // Replace images array with single new file
      setForm(prevForm => ({
        ...prevForm,
        images: [file]
      }));
      
      console.log('EditPlot - New image set successfully');
    }
  };

  const removeImage = (index) => {
    const newImages = [...form.images];
    newImages.splice(index, 1);
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setForm({ ...form, images: newImages });
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('[EditPlot] Submission already in progress, ignoring duplicate request');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate plot number
      if (plotNumberError) {
        setIsSubmitting(false);
        alert('Plot number must contain only digits');
        return;
      }
      
      // Create FormData like society profile
      const formData = new FormData();
      formData.append('plot_number', form.plot_number);
      formData.append('marla_size', form.marla_size);
      formData.append('price', form.price);
      formData.append('status', form.status);
      formData.append('type', form.type);
      formData.append('area', form.area);
      formData.append('dimension_x', Number(form.dimension_x));
      formData.append('dimension_y', Number(form.dimension_y));
      
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
      
      // Check if we have either new image or existing image
      const hasNewImage = form.images.length > 0 && form.images.some(img => img instanceof File);
      const hasExistingImage = imagePreviews.length > 0 && imagePreviews.some(img => 
        (typeof img === 'object' && img.isBase64) || 
        (typeof img === 'string' && !img.startsWith('blob:'))
      );
      
      console.log('[EditPlot] Image validation:', { hasNewImage, hasExistingImage });
      
      // Image is mandatory - must have either new or existing image
      if (!hasNewImage && !hasExistingImage) {
        // Show red border validation instead of alert
        setImageError(true);
        setIsSubmitting(false);
        return;
      }
      
      // Clear image error if validation passes
      setImageError(false);
      
      // Add new images if any (matching backend expectation)
      console.log('[EditPlot] Processing images for FormData:', {
        totalImages: form.images.length,
        fileImages: form.images.filter(img => img instanceof File).length
      });
      
      form.images.forEach((file, index) => {
        if (file instanceof File) {
          console.log(`[EditPlot] Adding image ${index} to FormData:`, file.name, file.type, file.size);
          formData.append('plot_image', file);
        }
      });
      
      // Debug FormData contents
      console.log('[EditPlot] FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      }
      
      // Call the parent's onSubmit handler with FormData
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Error updating plot:', error);
      alert('Error updating plot: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-6xl mx-auto min-h-95vh">
      <h2 className="text-2xl font-bold text-[#2F3D57] mb-6">Edit Plot</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plot Size (Marla) <span className="text-red-600">*</span>
              </label>
              <select
                name="marla_size"
                value={form.marla_size}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                required
              >
                <option value="">Select plot size</option>
                {availablePlotSizes.length > 0 ? (
                  availablePlotSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No plot sizes available in profile</option>
                )}
              </select>
              {availablePlotSizes.length === 0 && (
                <p className="text-orange-600 text-xs mt-1">
                  Please add available plot sizes in your Society Profile first
                </p>
              )}
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
                <input
                  type="text"
                  name="area"
                  value={form.area}
                  readOnly
                  disabled
                  className="w-full border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="Auto-calculated"
                />
                <p className="text-gray-500 text-xs mt-1">Auto-calculated from X Ã— Y</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimension X (ft)</label>
                <input
                  type="number"
                  name="dimension_x"
                  value={form.dimension_x}
                  readOnly
                  className="w-full border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                  placeholder="Auto-filled from marla size"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimension Y (ft)</label>
                <input
                  type="number"
                  name="dimension_y"
                  value={form.dimension_y}
                  readOnly
                  className="w-full border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                  placeholder="Auto-filled from marla size"
                  required
                />
              </div>
            </div>
          </div>
          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="space-y-2">
                {form.description.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="mr-2">â€¢</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Image Upload Section */}
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
                  multiple={false}
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
              
              {/* Image previews in view format */}
              {imagePreviews.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => {
                      // Handle both string URLs and image data objects
                      const isObject = typeof preview === 'object' && preview !== null;
                      const imageUrl = isObject ? (preview.workingUrl || preview.currentUrl) : preview;
                      const isNewImage = typeof preview === 'string' && preview.startsWith('blob:');
                      
                      return (
                        <div key={index} className="text-center">
                          <div className="relative inline-block">
                            {/* Image element */}
                            <img
                              src={imageUrl}
                              alt={`Plot Image ${index + 1}`}
                              style={{
                                maxWidth: '200px',
                                maxHeight: '200px',
                                width: 'auto',
                                height: 'auto',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                console.error('Failed to load image:', imageUrl);
                                // Try next URL if this is an object with multiple URLs
                                if (isObject && preview.urls && preview.urls.length > 1) {
                                  const currentIndex = preview.urls.indexOf(imageUrl);
                                  const nextIndex = currentIndex + 1;
                                  if (nextIndex < preview.urls.length) {
                                    console.log(`Trying next URL for image ${index}:`, preview.urls[nextIndex]);
                                    e.target.src = preview.urls[nextIndex];
                                    preview.currentUrl = preview.urls[nextIndex];
                                    return;
                                  }
                                }
                                // If no more URLs to try, show placeholder
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'block';
                              }}
                              onLoad={(event) => {
                                console.log('Image loaded successfully:', imageUrl);
                                // Hide error placeholder if image loads
                                const errorDiv = event.target.nextElementSibling;
                                if (errorDiv && errorDiv.classList.contains('error-placeholder')) {
                                  errorDiv.style.display = 'none';
                                }
                              }}
                            />
                            
                            {/* Error placeholder */}
                            <div 
                              className="error-placeholder w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                              style={{ display: 'none', maxWidth: '200px', maxHeight: '200px' }}
                            >
                              <div className="text-center text-gray-500">
                                <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <p className="text-xs">Image failed to load</p>
                                {isObject && (
                                  <p className="text-xs mt-1 font-mono text-gray-400">{preview.originalName}</p>
                                )}
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
                              title="Remove image"
                            >
                              Ã—
                            </button>
                          </div>
                          
                          {/* Image caption */}
                          <p className="text-xs text-gray-600 mt-2">
                            {isNewImage ? 'New Image Preview' : 'Current Image'}
                          </p>
                          
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary */}
                  <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">Total Images: {imagePreviews.length}</p>
                    <p className="text-xs mt-1">
                      {imagePreviews.filter(img => typeof img === 'string' && img.startsWith('blob:')).length} new image(s), 
                      {imagePreviews.filter(img => typeof img === 'object' || (typeof img === 'string' && !img.startsWith('blob:'))).length} existing image(s)
                    </p>
                  </div>
                </div>
              )}
              
              {/* No images placeholder */}
              {imagePreviews.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No image uploaded yet</p>
                  <p className="text-gray-400 text-xs mt-1">Click "Upload Image" to add a plot image</p>
                </div>
              )}
            </div>
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
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md ${
                isSubmitting
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#ED7600] text-white hover:bg-[#D56900]'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Plot...
                </span>
              ) : (
                'Update Plot'
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

export default EditPlotForm;
