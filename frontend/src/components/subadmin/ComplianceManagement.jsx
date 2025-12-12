import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getSocietyCompliances,
  createCompliance,
  updateCompliance,
  deleteCompliance
} from '../../services/complianceAPI';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ComplianceManagement = () => {
  const { user } = useAuth();
  const [compliances, setCompliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [societyPlots, setSocietyPlots] = useState([]);
  const [loadingPlots, setLoadingPlots] = useState(true);
  
  // Get society ID - for society users, their user ID is their society ID
  const getSocietyId = async () => {
    // Get the society profile ID (not user.societyId)
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/society-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileId = response.data?.profile?._id;
      console.log('[Compliance] Society Profile ID:', profileId);
      return profileId;
    } catch (error) {
      console.error('[Compliance] Error fetching society profile:', error);
      return null;
    }
  };
  const [formData, setFormData] = useState({
    marla_size: '',
    max_ground_coverage: 75,
    front_setback: 10,
    rear_setback: 10,
    side_setback_left: 5,
    side_setback_right: 5,
    fixed_garden_area: 150,
    fixed_carporch_area: 200,
    min_room_height: 10,
    min_bathroom_size: 45,
    min_kitchen_size: 90,
    min_bedroom_size: 120,
    min_living_room_size: 200,
    min_open_space: 25,
    building_type_allowed: 'Residential',
    additional_rules: [],
    notes: ''
  });
  const [newRule, setNewRule] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const allMarlaOptions = ['5 Marla', '6 Marla', '7 Marla', '10 Marla', '1 Kanal', '2 Kanal'];

  // Get unique plot sizes that actually exist in the society
  const getSocietyPlotSizes = () => {
    if (loadingPlots) {
      return allMarlaOptions; // Show all while loading
    }
    
    if (societyPlots.length === 0) {
      console.log('[Compliance] No plots loaded yet, showing all options');
      return allMarlaOptions;
    }
    
    // Extract unique marla sizes from society plots
    // Try both 'marla_size' and 'Plot Size' field names
    const uniqueSizes = [...new Set(societyPlots.map(plot => plot.marla_size || plot['Plot Size'] || plot.plotSize))].filter(Boolean);
    
    console.log('[Compliance] getSocietyPlotSizes - uniqueSizes:', uniqueSizes);
    console.log('[Compliance] getSocietyPlotSizes - allMarlaOptions:', allMarlaOptions);
    
    // Return all unique sizes from society plots (they are all valid)
    console.log('[Compliance] getSocietyPlotSizes - returning unique sizes:', uniqueSizes);
    return uniqueSizes;
  };

  const marlaOptions = getSocietyPlotSizes();

  // Get available plot sizes (exist in society but not yet configured in compliance)
  const getAvailablePlotSizes = () => {
    const existingCompliances = compliances.map(c => c.marla_size);
    return marlaOptions.filter(size => !existingCompliances.includes(size));
  };

  // Plot-specific compliance defaults based on Pakistani building standards
  const getPlotDefaults = (marlaSize) => {
    const defaults = {
      '5 Marla': {
        max_ground_coverage: 75,
        front_setback: 5,
        rear_setback: 5,
        side_setback_left: 3,
        side_setback_right: 3,
        fixed_garden_area: 100,
        fixed_carporch_area: 180,
        min_bathroom_size: 45,
        min_kitchen_size: 90,
        min_bedroom_size: 120,
        min_living_room_size: 200,
        min_open_space: 25
      },
      '6 Marla': {
        max_ground_coverage: 73,
        front_setback: 6,
        rear_setback: 5,
        side_setback_left: 3,
        side_setback_right: 3,
        fixed_garden_area: 120,
        fixed_carporch_area: 190,
        min_bathroom_size: 48,
        min_kitchen_size: 95,
        min_bedroom_size: 130,
        min_living_room_size: 225,
        min_open_space: 27
      },
      '7 Marla': {
        max_ground_coverage: 72,
        front_setback: 6,
        rear_setback: 5,
        side_setback_left: 4,
        side_setback_right: 4,
        fixed_garden_area: 150,
        fixed_carporch_area: 200,
        min_bathroom_size: 50,
        min_kitchen_size: 100,
        min_bedroom_size: 140,
        min_living_room_size: 250,
        min_open_space: 28
      },
      '10 Marla': {
        max_ground_coverage: 70,
        front_setback: 8,
        rear_setback: 6,
        side_setback_left: 5,
        side_setback_right: 5,
        fixed_garden_area: 200,
        fixed_carporch_area: 220,
        min_bathroom_size: 60,
        min_kitchen_size: 120,
        min_bedroom_size: 168,
        min_living_room_size: 300,
        min_open_space: 30
      },
      '1 Kanal': {
        max_ground_coverage: 65,
        front_setback: 10,
        rear_setback: 8,
        side_setback_left: 6,
        side_setback_right: 6,
        fixed_garden_area: 300,
        fixed_carporch_area: 250,
        min_bathroom_size: 70,
        min_kitchen_size: 150,
        min_bedroom_size: 200,
        min_living_room_size: 350,
        min_open_space: 35
      },
      '2 Kanal': {
        max_ground_coverage: 60,
        front_setback: 15,
        rear_setback: 10,
        side_setback_left: 8,
        side_setback_right: 8,
        fixed_garden_area: 500,
        fixed_carporch_area: 300,
        min_bathroom_size: 80,
        min_kitchen_size: 200,
        min_bedroom_size: 250,
        min_living_room_size: 400,
        min_open_space: 40
      }
    };
    return defaults[marlaSize] || defaults['5 Marla'];
  };

  useEffect(() => {
    const initData = async () => {
      const societyId = await getSocietyId();
      if (societyId) {
        fetchCompliances(societyId);
        fetchSocietyPlots(societyId);
      } else {
        // No societyId, stop loading and show empty state
        setLoading(false);
        setLoadingPlots(false);
        console.log('[Compliance] User data:', user);
        console.log('[Compliance] No society ID found in user object');
      }
    };
    initData();
  }, [user]);

  const fetchSocietyPlots = async (societyId) => {
    try {
      setLoadingPlots(true);
      console.log('[Compliance] Fetching plots for society:', societyId);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/plots/society/${societyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[Compliance] Plots API response:', response.data);
      
      // Backend returns plots array directly (not nested in success/data wrapper)
      const plots = Array.isArray(response.data) ? response.data : [];
      setSocietyPlots(plots);
      console.log('[Compliance] Loaded plots:', plots);
      console.log('[Compliance] Unique plot sizes:', [...new Set(plots.map(p => p.marla_size).filter(Boolean))]);
    } catch (error) {
      console.error('[Compliance] Error fetching plots:', error);
      console.error('[Compliance] Error response:', error.response?.data);
      setSocietyPlots([]);
    } finally {
      setLoadingPlots(false);
    }
  };

  const fetchCompliances = async (societyId) => {
    try {
      setLoading(true);
      console.log('[Compliance] Fetching compliances for society:', societyId);
      const response = await getSocietyCompliances(societyId);
      console.log('[Compliance] Response:', response);
      console.log('[Compliance] Data array:', response.data);
      console.log('[Compliance] Array length:', response.data?.length);
      setCompliances(response.data || []);
      console.log('[Compliance] State updated with', response.data?.length || 0, 'items');
    } catch (error) {
      console.error('[Compliance] Error:', error);
      showAlert(error.message || 'Failed to load compliance rules', 'error');
      setCompliances([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    // Longer timeout for error messages with multiple items
    const timeout = type === 'error' ? 8000 : 5000;
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), timeout);
  };

  const validateForm = () => {
    const errors = [];
    
    // Check required fields
    if (!formData.marla_size) {
      errors.push('📐 Plot Size is required');
    }
    
    if (!formData.max_ground_coverage || formData.max_ground_coverage <= 0) {
      errors.push('🏗️ Maximum Ground Coverage must be greater than 0');
    }
    
    if (formData.max_ground_coverage < 30 || formData.max_ground_coverage > 80) {
      errors.push('🏗️ Ground Coverage must be between 30% and 80%');
    }
    
    // Validate setbacks
    if (formData.front_setback < 3 || formData.front_setback > 20) {
      errors.push('📏 Front Setback must be between 3 and 20 feet');
    }
    
    if (formData.rear_setback < 3 || formData.rear_setback > 20) {
      errors.push('📏 Rear Setback must be between 3 and 20 feet');
    }
    
    if (formData.side_setback_left < 2 || formData.side_setback_left > 15) {
      errors.push('📏 Left Side Setback must be between 2 and 15 feet');
    }
    
    if (formData.side_setback_right < 2 || formData.side_setback_right > 15) {
      errors.push('📏 Right Side Setback must be between 2 and 15 feet');
    }
    
    // Validate fixed areas
    if (!formData.fixed_garden_area || formData.fixed_garden_area < 50) {
      errors.push('🌳 Fixed Garden Area must be at least 50 sq ft');
    }
    
    if (formData.fixed_garden_area > 1000) {
      errors.push('🌳 Fixed Garden Area cannot exceed 1000 sq ft');
    }
    
    if (!formData.fixed_carporch_area || formData.fixed_carporch_area < 100) {
      errors.push('🚗 Fixed Car Porch Area must be at least 100 sq ft');
    }
    
    if (formData.fixed_carporch_area > 500) {
      errors.push('🚗 Fixed Car Porch Area cannot exceed 500 sq ft');
    }
    
    // Validate room sizes
    if (!formData.min_bedroom_size || formData.min_bedroom_size < 120) {
      errors.push('🛏️ Minimum Bedroom Size must be at least 120 sq ft');
    }
    
    if (formData.min_bedroom_size > 300) {
      errors.push('🛏️ Bedroom Size cannot exceed 300 sq ft');
    }
    
    if (!formData.min_kitchen_size || formData.min_kitchen_size < 90) {
      errors.push('🍳 Minimum Kitchen Size must be at least 90 sq ft');
    }
    
    if (formData.min_kitchen_size > 250) {
      errors.push('🍳 Kitchen Size cannot exceed 250 sq ft');
    }
    
    if (!formData.min_bathroom_size || formData.min_bathroom_size < 45) {
      errors.push('🚿 Minimum Bathroom Size must be at least 45 sq ft');
    }
    
    if (formData.min_bathroom_size > 100) {
      errors.push('🚿 Bathroom Size cannot exceed 100 sq ft');
    }
    
    if (!formData.min_living_room_size || formData.min_living_room_size < 200) {
      errors.push('🛋️ Minimum Living Room Size must be at least 200 sq ft');
    }
    
    if (formData.min_living_room_size > 500) {
      errors.push('🛋️ Living Room Size cannot exceed 500 sq ft');
    }
    
    // Validate open space
    if (!formData.min_open_space || formData.min_open_space < 15) {
      errors.push('🌿 Minimum Open Space must be at least 15%');
    }
    
    if (formData.min_open_space > 50) {
      errors.push('🌿 Open Space cannot exceed 50%');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      const errorMessage = 'Please fix the following:\n\n' + validationErrors.join('\n');
      showAlert(errorMessage, 'error');
      return;
    }
    
    try {
      if (editingId) {
        const response = await updateCompliance(editingId, formData);
        console.log('[Compliance] Update response:', response);
        showAlert('Compliance rules updated successfully! ✅', 'success');
      } else {
        const response = await createCompliance(formData);
        console.log('[Compliance] Create response:', response);
        showAlert('Compliance rules created successfully! ✅', 'success');
      }
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      
      // Refresh the list
      const societyId = await getSocietyId();
      if (societyId) {
        await fetchCompliances(societyId);
      }
    } catch (error) {
      console.error('[Compliance] Submit error:', error);
      showAlert(error.message || 'Failed to save compliance rules', 'error');
    }
  };

  const handleEdit = (compliance) => {
    setFormData({
      marla_size: compliance.marla_size,
      max_ground_coverage: compliance.max_ground_coverage,
      front_setback: compliance.front_setback,
      rear_setback: compliance.rear_setback,
      side_setback_left: compliance.side_setback_left,
      side_setback_right: compliance.side_setback_right,
      fixed_garden_area: compliance.fixed_garden_area || 150,
      fixed_carporch_area: compliance.fixed_carporch_area || 200,
      min_room_height: compliance.min_room_height,
      min_bathroom_size: compliance.min_bathroom_size,
      min_kitchen_size: compliance.min_kitchen_size,
      min_bedroom_size: compliance.min_bedroom_size,
      min_living_room_size: compliance.min_living_room_size || 200,
      min_open_space: compliance.min_open_space,
      building_type_allowed: compliance.building_type_allowed,
      additional_rules: compliance.additional_rules || [],
      notes: compliance.notes || ''
    });
    setEditingId(compliance._id);
    setShowForm(true);
  };

  const handleDelete = async (complianceId) => {
    if (!window.confirm('Are you sure you want to delete this compliance rule?')) return;
    
    try {
      await deleteCompliance(complianceId);
      showAlert('Compliance rules deleted successfully!', 'success');
      const societyId = await getSocietyId();
      if (societyId) {
        fetchCompliances(societyId);
      }
    } catch (error) {
      showAlert('Failed to delete compliance rules', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      marla_size: '',
      max_ground_coverage: 75,
      front_setback: 10,
      rear_setback: 10,
      side_setback_left: 5,
      side_setback_right: 5,
      fixed_garden_area: 150,
      fixed_carporch_area: 200,
      min_room_height: 10,
      min_bathroom_size: 45,
      min_kitchen_size: 90,
      min_bedroom_size: 120,
      min_living_room_size: 200,
      min_open_space: 25,
      building_type_allowed: 'Residential',
      additional_rules: [],
      notes: ''
    });
    setNewRule('');
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If plot size changes, auto-fill with recommended defaults
    if (name === 'marla_size') {
      const defaults = getPlotDefaults(value);
      setFormData(prev => ({
        ...prev,
        marla_size: value,
        ...defaults
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: ['max_ground_coverage', 'front_setback', 'rear_setback', 
                 'side_setback_left', 'side_setback_right', 'fixed_garden_area',
                 'fixed_carporch_area', 'min_room_height', 'min_bathroom_size', 
                 'min_kitchen_size', 'min_bedroom_size', 'min_living_room_size',
                 'min_open_space'].includes(name)
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({
        ...prev,
        additional_rules: [...prev.additional_rules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index) => {
    setFormData(prev => ({
      ...prev,
      additional_rules: prev.additional_rules.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Alert */}
      {alert.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-md rounded-lg shadow-2xl ${
          alert.type === 'success' 
            ? 'bg-green-500' 
            : 'bg-red-500'
        } text-white animate-slide-in`}>
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 mt-0.5">
              {alert.type === 'success' ? (
                <FiCheckCircle size={24} />
              ) : (
                <FiAlertCircle size={24} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">
                {alert.type === 'success' ? 'Success!' : 'Validation Error'}
              </h3>
              <div className="text-sm whitespace-pre-line">
                {alert.message}
              </div>
            </div>
            <button
              onClick={() => setAlert({ show: false, message: '', type: '' })}
              className="flex-shrink-0 hover:bg-white hover:bg-opacity-20 rounded p-1 transition"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Compliance Management</h1>
          <p className="text-gray-600 mt-2">Manage Pakistan building regulations for different plot sizes</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={getAvailablePlotSizes().length === 0}
          >
            <FiPlus /> Add Compliance Rules
          </button>
        )}
      </div>

      {/* Status Info */}
      {!showForm && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="text-blue-600 mt-1 flex-shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">
                Society Plot Status
              </h3>
              {loadingPlots ? (
                <p className="text-sm text-gray-600">Loading society plots...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>{societyPlots.length}</strong> total plots in your society
                    {marlaOptions.length > 0 && (
                      <span className="ml-2">
                        • <strong>{marlaOptions.length}</strong> unique plot sizes: <span className="font-semibold text-blue-600">{marlaOptions.join(', ')}</span>
                      </span>
                    )}
                  </p>
                  {compliances.length > 0 && (
                    <p className="text-sm text-gray-700">
                      <strong>{compliances.length} of {marlaOptions.length}</strong> plot sizes have compliance rules
                      {getAvailablePlotSizes().length > 0 && (
                        <span className="ml-2">
                          • Pending: <span className="font-semibold text-orange-600">{getAvailablePlotSizes().join(', ')}</span>
                        </span>
                      )}
                      {getAvailablePlotSizes().length === 0 && marlaOptions.length > 0 && (
                        <span className="ml-2 text-green-600 font-semibold">
                          • All configured! ✅
                        </span>
                      )}
                    </p>
                  )}
                  {compliances.length === 0 && marlaOptions.length > 0 && (
                    <p className="text-sm text-orange-600 font-medium">
                      ⚠️ No compliance rules configured yet. Click "Add Compliance Rules" to get started.
                    </p>
                  )}
                  {marlaOptions.length === 0 && (
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ No plots found in your society. Please add plots in Plot Management first.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingId ? 'Edit' : 'Add'} Compliance Rules
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plot Size */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                📐 Plot Size *
              </label>
              <select
                name="marla_size"
                value={formData.marla_size}
                onChange={handleChange}
                required
                disabled={editingId}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-lg font-semibold"
              >
                <option value="">Select plot size</option>
                {(editingId ? marlaOptions : getAvailablePlotSizes()).map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              {!editingId && getAvailablePlotSizes().length === 0 && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  ⚠️ All plot sizes have been configured. Edit existing rules to make changes.
                </p>
              )}
              {!editingId && getAvailablePlotSizes().length > 0 && (
                <p className="text-xs text-blue-700 mt-2 font-medium">
                  ✨ Auto-fills recommended values based on Pakistani building standards
                </p>
              )}
              {editingId && (
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  📝 Editing existing compliance rules for this plot size
                </p>
              )}
            </div>

            {/* Ground Floor Coverage */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                🏗️ Maximum Ground Coverage (%) *
              </label>
              <input
                type="number"
                name="max_ground_coverage"
                value={formData.max_ground_coverage}
                onChange={handleChange}
                min="30"
                max="80"
                step="5"
                required
                className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-semibold"
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 <strong>Pakistani Standards:</strong> 5 Marla=75%, 7 Marla=72%, 10 Marla=70%, 1 Kanal=65%, 2 Kanal=60%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This ensures mandatory open spaces for setbacks, garden, and parking
              </p>
            </div>

            {/* Mandatory Setbacks */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                📏 Mandatory Setback Requirements (feet)
              </h3>
              <p className="text-sm text-gray-600 mb-4">Empty space that must be left from plot boundaries</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🔼 Front *</label>
                  <input
                    type="number"
                    name="front_setback"
                    value={formData.front_setback}
                    onChange={handleChange}
                    min="3"
                    max="20"
                    required
                    className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🔽 Rear *</label>
                  <input
                    type="number"
                    name="rear_setback"
                    value={formData.rear_setback}
                    onChange={handleChange}
                    min="3"
                    max="20"
                    required
                    className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">◀️ Left Side *</label>
                  <input
                    type="number"
                    name="side_setback_left"
                    value={formData.side_setback_left}
                    onChange={handleChange}
                    min="2"
                    max="15"
                    required
                    className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">▶️ Right Side *</label>
                  <input
                    type="number"
                    name="side_setback_right"
                    value={formData.side_setback_right}
                    onChange={handleChange}
                    min="2"
                    max="15"
                    required
                    className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Fixed Area Requirements */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                🏡 Fixed Area Requirements (sq ft)
              </h3>
              <p className="text-sm text-gray-600 mb-4">Mandatory dedicated spaces for each house</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    🌳 Fixed Garden Area *
                  </label>
                  <input
                    type="number"
                    name="fixed_garden_area"
                    value={formData.fixed_garden_area}
                    onChange={handleChange}
                    min="50"
                    max="1000"
                    step="10"
                    required
                    className="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-600 mt-1">Mandatory green space for every house</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    🚗 Fixed Car Porch Area *
                  </label>
                  <input
                    type="number"
                    name="fixed_carporch_area"
                    value={formData.fixed_carporch_area}
                    onChange={handleChange}
                    min="100"
                    max="500"
                    step="10"
                    required
                    className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-600 mt-1">Dedicated parking space requirement</p>
                </div>
              </div>
            </div>

            {/* Room Sizes */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                🛏️ Minimum Room Sizes (sq ft)
              </h3>
              <p className="text-sm text-gray-600 mb-4">Minimum dimensions for comfortable living spaces (based on Pakistani building standards)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">🛏️ Bedroom *</label>
                  <input
                    type="number"
                    name="min_bedroom_size"
                    value={formData.min_bedroom_size}
                    onChange={handleChange}
                    min="120"
                    max="300"
                    step="10"
                    required
                    className="w-full px-4 py-2 border-2 border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 120-300 sq ft</p>
                  <p className="text-xs text-gray-400">(10'×12' to 16'×18')</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">🍳 Kitchen *</label>
                  <input
                    type="number"
                    name="min_kitchen_size"
                    value={formData.min_kitchen_size}
                    onChange={handleChange}
                    min="90"
                    max="250"
                    step="10"
                    required
                    className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 90-250 sq ft</p>
                  <p className="text-xs text-gray-400">(9'×10' to 16'×13')</p>
                </div>
                <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">🚿 Bathroom *</label>
                  <input
                    type="number"
                    name="min_bathroom_size"
                    value={formData.min_bathroom_size}
                    onChange={handleChange}
                    min="45"
                    max="100"
                    step="5"
                    required
                    className="w-full px-4 py-2 border-2 border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 45-100 sq ft</p>
                  <p className="text-xs text-gray-400">(5'7"×8' to 9'×11')</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">🛋️ Living Room *</label>
                  <input
                    type="number"
                    name="min_living_room_size"
                    value={formData.min_living_room_size}
                    onChange={handleChange}
                    min="200"
                    max="500"
                    step="10"
                    required
                    className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: 200-500 sq ft</p>
                  <p className="text-xs text-gray-400">(14'×14' to 20'×25')</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 italic">
                💡 Values auto-adjust based on selected plot size (5 Marla to 2 Kanal)
              </div>
            </div>

            {/* Other Requirements */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                ⚙️ Additional Requirements
              </h3>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  🌿 Minimum Open Space (%) *
                </label>
                <input
                  type="number"
                  name="min_open_space"
                  value={formData.min_open_space}
                  onChange={handleChange}
                  min="15"
                  max="50"
                  step="5"
                  required
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-600 mt-1">Total open/uncovered area including setbacks and garden</p>
              </div>
            </div>

            {/* Building Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building Type Allowed
              </label>
              <select
                name="building_type_allowed"
                value={formData.building_type_allowed}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Mixed">Mixed Use</option>
              </select>
            </div>

            {/* Additional Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Rules
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Add a custom rule..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                />
                <button
                  type="button"
                  onClick={addRule}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formData.additional_rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{rule}</span>
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Any additional notes or clarifications..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
              >
                <FiSave /> {editingId ? 'Update' : 'Create'} Compliance Rules
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Compliance List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {compliances.map((compliance) => (
          <div key={compliance._id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{compliance.marla_size}</h3>
                <span className="text-sm text-gray-500">{compliance.building_type_allowed}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(compliance)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDelete(compliance._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                <span className="text-gray-700 font-medium">🏗️ Ground Coverage:</span>
                <span className="font-bold text-orange-600">{compliance.max_ground_coverage}%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-gray-700 font-medium">🌳 Garden Area:</span>
                <span className="font-bold text-green-600">{compliance.fixed_garden_area || 0} sq ft</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-gray-700 font-medium">🚗 Car Porch:</span>
                <span className="font-bold text-blue-600">{compliance.fixed_carporch_area || 0} sq ft</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-indigo-50 rounded">
                <span className="text-gray-700 font-medium">🛋️ Living Room:</span>
                <span className="font-bold text-indigo-600">{compliance.min_living_room_size || 200} sq ft</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700 font-medium">📏 Setbacks:</span>
                <span className="font-bold text-gray-700">{compliance.front_setback}' / {compliance.rear_setback}' / {compliance.side_setback_left}'</span>
              </div>
              {compliance.additional_rules && compliance.additional_rules.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="text-gray-600 text-xs">
                    +{compliance.additional_rules.length} additional rules
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {compliances.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No compliance rules found</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Create your first compliance rule
          </button>
        </div>
      )}
    </div>
  );
};

export default ComplianceManagement;
