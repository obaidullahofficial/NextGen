import React, { useState, useEffect } from "react";
import { FiPhone } from "react-icons/fi";
import AlertModal from '../common/AlertModal';
import { useAlert } from '../../hooks/useAlert';
import { getSocietyProfile } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { floorplanAPI } from '../../services/floorplanAPI';
import { getDimensionsForPlotSize } from '../../utils/marlaCalculator';

const AddPlotForm = ({ onSubmit, onCancel}) => {
  const { user } = useAuth();
  const [savedFloorplans, setSavedFloorplans] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonTemplateMode, setJsonTemplateMode] = useState('none');

  const [form, setForm] = useState({
    plotId: "",
    plot_number: "", // New field for plot number
    price: "",
    status: "Available",
    type: "Residential",
    area: "",
    marla_size: "", // New field for marla size
    dimension_x: "",
    dimension_y: "",
    description: [""],
    saved_floorplan_id: "",
    saved_floorplan_name: "",
    images: [] // New field for storing images
  });

  const [baseArea, setBaseArea] = useState(0); // Track the base area for dimension calculations
  const [societyMarlaData, setSocietyMarlaData] = useState(null); // Society-specific marla data
  const [availablePlotSizes, setAvailablePlotSizes] = useState([]);

  const [imagePreviews, setImagePreviews] = useState([]); // For displaying previews
  const [plotImage, setPlotImage] = useState(null); // For storing single image file
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission
  const [imageError, setImageError] = useState(false); // Track image validation error
  const [plotNumberError, setPlotNumberError] = useState('');
  const { alertState, showError, showWarning, showSuccess } = useAlert();

  // Fetch user floorplans for dropdown
  useEffect(() => {
    const fetchFloorplans = async () => {
      try {
        const userId = user?.id || user?._id;
        if (user && userId) {
          const response = user.role === 'subadmin'
            ? await floorplanAPI.getSocietyFloorplans(userId)
            : await floorplanAPI.getUserFloorplans(userId);

          if (response && response.success) {
            const plans = response.floorplans || response.floor_plans || response.data || [];
            setSavedFloorplans(Array.isArray(plans) ? plans : []);
          } else {
            setSavedFloorplans([]);
          }
        }
      } catch (error) {
        console.error('Error fetching floorplans:', error);
        setSavedFloorplans([]);
      }
    };
    fetchFloorplans();
  }, [user]);

  // Fetch society profile to get available plot sizes and marla standard
  useEffect(() => {
    const fetchSocietyProfile = async () => {
      try {
        const result = await getSocietyProfile();
        if (result.success && result.profile) {
          // Get available plot sizes from society profile
          if (result.profile.available_plots && Array.isArray(result.profile.available_plots)) {
            setAvailablePlotSizes(result.profile.available_plots);
            console.log('[AddPlot] Available plot sizes from society:', result.profile.available_plots);
          }
          
          // Get society-specific marla data if configured
          if (result.profile.marla_data) {
            setSocietyMarlaData(result.profile.marla_data);
            console.log('[AddPlot] Society marla standard set to:', result.profile.marla_data.marlaStandard, 'sq ft per marla');
          } else {
            console.warn('[AddPlot] No marla data configured for this society. Please set up the marla standard in Society Profile.');
          }
        }
      } catch (error) {
        console.error('Error fetching society profile:', error);
      }
    };
    fetchSocietyProfile();
  }, []);

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
      if (!societyMarlaData) {
        showWarning('Society Configuration Required', 'Please configure the marla standard for your society in the Society Profile first.');
        return;
      }
      
      // Get dimensions from society-specific marla data
      const dimensions = getDimensionsForPlotSize(value, societyMarlaData);
      if (dimensions) {
        const area = dimensions.sqft;
        setBaseArea(area); // Store base area for dynamic calculations
        console.log(`[AddPlot] Selected ${value}: ${dimensions.x}×${dimensions.y} ft = ${area} sq ft`);
        setForm({ 
          ...form, 
          marla_size: value,
          dimension_x: dimensions.x.toString(),
          dimension_y: dimensions.y.toString(),
          area: `${area.toFixed(2)} sq ft`
        });
      } else {
        showError('Invalid Plot Size', `No dimensions found for ${value}. Please reconfigure your society's marla standard.`);
        setForm({ ...form, [name]: value });
      }
    }
    // Dynamic dimension adjustment - maintain constant area
    else if (name === 'dimension_x') {
      const newX = parseFloat(value);
      if (newX && baseArea && newX > 0) {
        // Calculate new Y to maintain area: Y = Area / X
        const newY = (baseArea / newX).toFixed(2);
        setForm({
          ...form,
          dimension_x: value,
          dimension_y: newY.toString(),
          area: `${baseArea.toFixed(2)} sq ft`
        });
      } else {
        setForm({ ...form, [name]: value });
      }
    }
    else if (name === 'dimension_y') {
      const newY = parseFloat(value);
      if (newY && baseArea && newY > 0) {
        // Calculate new X to maintain area: X = Area / Y
        const newX = (baseArea / newY).toFixed(2);
        setForm({
          ...form,
          dimension_x: newX.toString(),
          dimension_y: value,
          area: `${baseArea.toFixed(2)} sq ft`
        });
      } else {
        setForm({ ...form, [name]: value });
      }
    }
    else if (name === 'saved_floorplan_id') {
      const selectedPlan = savedFloorplans.find(p => String(p._id) === String(value) || String(p.id) === String(value));
      setJsonTemplateMode(value ? 'select' : 'none');
      if (value) {
        setJsonFile(null);
      }
      setForm({
        ...form, 
        saved_floorplan_id: value, 
        saved_floorplan_name: selectedPlan ? (selectedPlan.plotName || selectedPlan.name || selectedPlan.project_name || '') : ''
      });
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

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else if (file) {
      showError('Invalid File', 'Please upload a PDF file.');
    }
  };

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    // application/json or text/plain depending on browser
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      setJsonTemplateMode('upload');
      setForm(prev => ({ ...prev, saved_floorplan_id: '', saved_floorplan_name: '' }));
      setJsonFile(file);
    } else if (file) {
      showError('Invalid File', 'Please upload a JSON file.');
    }
  };

  const removeImage = () => {
    setPlotImage(null);
    setImagePreviews([]);
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
      const requiredFields = ['plot_number', 'marla_size', 'price', 'area', 'dimension_x', 'dimension_y'];
      for (let field of requiredFields) {
        if (!form[field] || form[field].toString().trim() === '') {
          // Reset states before showing alert so button becomes available again after user clicks OK
          setLoading(false);
          setIsSubmitting(false);
          await showWarning('Missing Information', `Please fill in ${field.replace('_', ' ')}.`);
          return;
        }
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
      formData.append('marla_size', form.marla_size);
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
      
      // Add plot image (matching backend expectation)
      if (plotImage) {
        console.log('[AddPlot] Adding plot image to FormData:', plotImage.name, plotImage.type, plotImage.size);
        formData.append('plot_image', plotImage);
      }

      // Add templates to FormData
      if (pdfFile) {
        formData.append('pdf_template', pdfFile);
      }
      if (jsonTemplateMode === 'upload' && jsonFile) {
        formData.append('json_template', jsonFile);
      }
      if (jsonTemplateMode === 'select' && form.saved_floorplan_id) {
        formData.append('saved_floorplan_id', form.saved_floorplan_id);
      }
      if (jsonTemplateMode === 'select' && form.saved_floorplan_name) {
        formData.append('saved_floorplan_name', form.saved_floorplan_name);
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
          marla_size: "",
          dimension_x: "",
          dimension_y: "",
          description: [""],
          saved_floorplan_id: "",
          saved_floorplan_name: "",
          images: []
        });
        setPlotImage(null);
        setImagePreviews([]);
        setPdfFile(null);
        setJsonFile(null);
        setJsonTemplateMode('none');
        
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
                  ⚠️ No plot sizes configured. Please add sizes in your Society Profile first.
                </p>
              )}
              {availablePlotSizes.length > 0 && !societyMarlaData && (
                <p className="text-orange-600 text-xs mt-1">
                  ⚠️ Society marla standard not configured. Dimensions will not auto-fill. Configure in Society Profile.
                </p>
              )}
              {societyMarlaData && (
                <p className="text-green-600 text-xs mt-1">
                  ✅ Society marla standard: {societyMarlaData.marlaStandard} sq ft per marla
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">📌 Only select from your society's configured plot sizes</p>
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
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                  placeholder="Change X, Y adjusts to keep area same"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">Change X, Y auto-adjusts</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dimension Y (ft)</label>
                <input
                  type="number"
                  name="dimension_y"
                  value={form.dimension_y}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                  placeholder="Change Y, X adjusts to keep area same"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">Change Y, X auto-adjusts</p>
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

            {/* Templates Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200 mt-4 rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-700">Floorplan Template Options</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose JSON Floorplan Source</label>
                <select
                  value={jsonTemplateMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setJsonTemplateMode(mode);
                    if (mode !== 'upload') {
                      setJsonFile(null);
                    }
                    if (mode !== 'select') {
                      setForm(prev => ({ ...prev, saved_floorplan_id: '', saved_floorplan_name: '' }));
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                >
                  <option value="none">None</option>
                  <option value="upload">Upload JSON from PC</option>
                  <option value="select">Select from Saved Floorplans</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose only one option: upload JSON file or select from dropdown.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Saved Floorplan</label>
                <select
                  name="saved_floorplan_id"
                  value={form.saved_floorplan_id}
                  onChange={handleChange}
                  disabled={jsonTemplateMode !== 'select'}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
                >
                  <option value="">-- None --</option>
                  {savedFloorplans.map(plan => (
                    <option key={plan._id || plan.id} value={plan._id || plan.id}>
                      {plan.plotName || plan.name || plan.project_name || 'Unnamed Plan'} - {(plan.createdAt || plan.created_at) ? new Date(plan.createdAt || plan.created_at).toLocaleDateString() : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select a pre-configured floorplan from your account.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload PDF Template</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#ED7600] file:text-white hover:file:bg-[#D56900]"
                  />
                  {pdfFile && <p className="text-xs text-green-600 mt-1 font-semibold">✓ {pdfFile.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload JSON Template</label>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleJsonUpload}
                    disabled={jsonTemplateMode !== 'upload'}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#ED7600] file:text-white hover:file:bg-[#D56900]"
                  />
                  {jsonFile && <p className="text-xs text-green-600 mt-1 font-semibold">✓ {jsonFile.name}</p>}
                </div>
              </div>
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
                  <div className="mb-2 text-sm text-green-600">âœ“ Current Image</div>
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
