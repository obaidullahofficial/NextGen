import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getSocietyCompliances,
  createCompliance,
  updateCompliance,
  deleteCompliance,
  getMarlaDimensions,
  getAvailableMarlas
} from '../../services/complianceAPI';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { getDimensionsForPlotSize, getAvailablePlotSizes } from '../../utils/marlaCalculator';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://nextgen-ta95.onrender.com/api';

const ComplianceManagement = () => {
  const { user } = useAuth();
  const [compliances, setCompliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [societyPlots, setSocietyPlots] = useState([]);
  const [loadingPlots, setLoadingPlots] = useState(true);
  const [totalAreaPercentage, setTotalAreaPercentage] = useState(0);
  const [availableAreaPercentage, setAvailableAreaPercentage] = useState(100);
  const [societyMarlaData, setSocietyMarlaData] = useState(null);
  
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
      
      // Fetch marla data from society profile
      if (response.data?.profile?.marla_data) {
        setSocietyMarlaData(response.data.profile.marla_data);
        console.log('[Compliance] Society marla standard set to:', response.data.profile.marla_data.marlaStandard, 'sq ft per marla');
      }
      
      return profileId;
    } catch (error) {
      console.error('[Compliance] Error fetching society profile:', error);
      return null;
    }
  };
  const [formData, setFormData] = useState({
    marla_size: '',
    total_plot_area: '', // Display-only, calculated from marla_size
    // Room count requirements
    bedrooms: 0,
    bathrooms: 0,
    livingRooms: 0,
    kitchens: 0,
    drawingrooms: 0,
    carporches: 0,
    gardens: 0,
    // Room area requirements (sq ft per room)
    bedroom_area: 0,
    bathroom_area: 0,
    livingroom_area: 0,
    kitchen_area: 0,
    drawingroom_area: 0,
    carporch_area: 0,
    garden_area: 0,
    // Room area percentages (% of ground coverage)
    bedroom_percentage: 0,
    bathroom_percentage: 0,
    livingroom_percentage: 0,
    kitchen_percentage: 0,
    drawingroom_percentage: 0,
    carporch_percentage: 0,
    garden_percentage: 0,
    // Room connections
    roomConnections: [],
    max_ground_coverage: 75,
    front_setback: 10,
    rear_setback: 10,
    side_setback_left: 5,
    side_setback_right: 5,
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

  // Area calculation functions
  const calculateAreaBreakdown = () => {
    if (!formData.marla_size || !formData.total_plot_area) {
      return null;
    }

    const totalPlotArea = parseFloat(formData.total_plot_area) || 0;
    
    // Get marla dimensions for setback calculation (but compliance applies to all plots of this marla size)
    // Compliance is area-based, so dimensions are just for reference in setback calculations
    const dimensions = societyMarlaData ? getDimensionsForPlotSize(formData.marla_size, societyMarlaData) : null;
    const plotX = dimensions?.x || 0;
    const plotY = dimensions?.y || 0;

    // Calculate setback area
    const frontSetback = parseFloat(formData.front_setback) || 0;
    const rearSetback = parseFloat(formData.rear_setback) || 0;
    const leftSetback = parseFloat(formData.side_setback_left) || 0;
    const rightSetback = parseFloat(formData.side_setback_right) || 0;

    // Setback area calculation (approximate)
    const setbackArea = (frontSetback * plotX) + (rearSetback * plotX) + 
                       (leftSetback * (plotY - frontSetback - rearSetback)) + 
                       (rightSetback * (plotY - frontSetback - rearSetback));

    // Calculate total room areas
    const roomAreas = {
      bedrooms: (parseInt(formData.bedrooms) || 0) * (parseFloat(formData.bedroom_area) || 0),
      bathrooms: (parseInt(formData.bathrooms) || 0) * (parseFloat(formData.bathroom_area) || 0),
      livingRooms: (parseInt(formData.livingRooms) || 0) * (parseFloat(formData.livingroom_area) || 0),
      kitchens: (parseInt(formData.kitchens) || 0) * (parseFloat(formData.kitchen_area) || 0),
      drawingrooms: (parseInt(formData.drawingrooms) || 0) * (parseFloat(formData.drawingroom_area) || 0),
      carporches: (parseInt(formData.carporches) || 0) * (parseFloat(formData.carporch_area) || 0),
      gardens: (parseInt(formData.gardens) || 0) * (parseFloat(formData.garden_area) || 0)
    };

    const totalRoomArea = Object.values(roomAreas).reduce((sum, area) => sum + area, 0);
    const groundCoverageArea = (totalPlotArea * (parseFloat(formData.max_ground_coverage) || 0)) / 100;
    
    // Calculate percentages for each room type
    const roomPercentages = {
      bedrooms: groundCoverageArea > 0 ? (roomAreas.bedrooms / groundCoverageArea * 100) : 0,
      bathrooms: groundCoverageArea > 0 ? (roomAreas.bathrooms / groundCoverageArea * 100) : 0,
      livingRooms: groundCoverageArea > 0 ? (roomAreas.livingRooms / groundCoverageArea * 100) : 0,
      kitchens: groundCoverageArea > 0 ? (roomAreas.kitchens / groundCoverageArea * 100) : 0,
      drawingrooms: groundCoverageArea > 0 ? (roomAreas.drawingrooms / groundCoverageArea * 100) : 0,
      carporches: groundCoverageArea > 0 ? (roomAreas.carporches / groundCoverageArea * 100) : 0,
      gardens: groundCoverageArea > 0 ? (roomAreas.gardens / groundCoverageArea * 100) : 0
    };
    
    const remainingArea = Math.max(0, groundCoverageArea - totalRoomArea);
    const utilizationPercentage = groundCoverageArea > 0 ? (totalRoomArea / groundCoverageArea * 100) : 0;

    return {
      totalPlotArea,
      setbackArea,
      groundCoverageArea,
      roomAreas,
      totalRoomArea,
      remainingArea,
      utilizationPercentage,
      roomPercentages
    };
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
    const breakdown = calculateAreaBreakdown();
    if (breakdown) {
      const { totalRoomArea, groundCoverageArea } = breakdown;
      const percentage = groundCoverageArea > 0 ? (totalRoomArea / groundCoverageArea) * 100 : 0;
      setTotalAreaPercentage(percentage);
      setAvailableAreaPercentage(100 - percentage);
    } else {
      setTotalAreaPercentage(0);
      setAvailableAreaPercentage(100);
    }
  }, [formData]);

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
      errors.push('ðŸ“ Plot Size is required');
    }
    
    if (!formData.max_ground_coverage || formData.max_ground_coverage <= 0) {
      errors.push('ðŸ—ï¸ Maximum Ground Coverage must be greater than 0');
    }
    
    if (formData.max_ground_coverage < 30 || formData.max_ground_coverage > 80) {
      errors.push('ðŸ—ï¸ Ground Coverage must be between 30% and 80%');
    }
    
    // Validate setbacks
    if (formData.front_setback < 3 || formData.front_setback > 20) {
      errors.push('ðŸ“ Front Setback must be between 3 and 20 feet');
    }
    
    if (formData.rear_setback < 3 || formData.rear_setback > 20) {
      errors.push('ðŸ“ Rear Setback must be between 3 and 20 feet');
    }
    
    if (formData.side_setback_left < 2 || formData.side_setback_left > 15) {
      errors.push('ðŸ“ Left Side Setback must be between 2 and 15 feet');
    }
    
    if (formData.side_setback_right < 2 || formData.side_setback_right > 15) {
      errors.push('ðŸ“ Right Side Setback must be between 2 and 15 feet');
    }
    
    // Validate room areas (optional but if provided should be reasonable)
    if (formData.bedroom_area < 0 || formData.bedroom_area > 500) {
      errors.push('ðŸ›ï¸ Bedroom area must be between 0 and 500 sq ft');
    }
    
    if (formData.bathroom_area < 0 || formData.bathroom_area > 200) {
      errors.push('ðŸš¿ Bathroom area must be between 0 and 200 sq ft');
    }
    
    if (formData.livingroom_area < 0 || formData.livingroom_area > 800) {
      errors.push('ðŸ›‹ï¸ Living room area must be between 0 and 800 sq ft');
    }
    
    if (formData.kitchen_area < 0 || formData.kitchen_area > 400) {
      errors.push('ðŸ³ Kitchen area must be between 0 and 400 sq ft');
    }
    
    if (formData.drawingroom_area < 0 || formData.drawingroom_area > 600) {
      errors.push('ðŸŽ¨ Drawing room area must be between 0 and 600 sq ft');
    }
    
    if (formData.garden_area < 0 || formData.garden_area > 1000) {
      errors.push('ðŸŒ³ Garden area must be between 0 and 1000 sq ft');
    }
    
    if (formData.carporch_area < 0 || formData.carporch_area > 500) {
      errors.push('ðŸš— Car porch area must be between 0 and 500 sq ft');
    }

    // Validate total area coverage
    const breakdown = calculateAreaBreakdown();
    if (breakdown && breakdown.utilizationPercentage > 100) {
      errors.push('ðŸš¨ Total area of all rooms exceeds the maximum allowed ground coverage!');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      const errorMessage = 'Please fix the following:https://nextgen-ta95.onrender.com/apinhttps://nextgen-ta95.onrender.com/apin' + validationErrors.join('https://nextgen-ta95.onrender.com/apin');
      showAlert(errorMessage, 'error');
      return;
    }
    
    try {
      if (editingId) {
        const response = await updateCompliance(editingId, formData);
        console.log('[Compliance] Update response:', response);
        showAlert('Compliance rules updated successfully! âœ…', 'success');
      } else {
        const response = await createCompliance(formData);
        console.log('[Compliance] Create response:', response);
        showAlert('Compliance rules created successfully! âœ…', 'success');
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
      total_plot_area: compliance.total_plot_area || '',
      // Room count requirements
      bedrooms: compliance.bedrooms || 0,
      bathrooms: compliance.bathrooms || 0,
      livingRooms: compliance.livingRooms || 0,
      kitchens: compliance.kitchens || 0,
      drawingrooms: compliance.drawingrooms || 0,
      carporches: compliance.carporches || 0,
      gardens: compliance.gardens || 0,
      // Room area requirements (sq ft per room)
      bedroom_area: compliance.bedroom_area || 0,
      bathroom_area: compliance.bathroom_area || 0,
      livingroom_area: compliance.livingroom_area || 0,
      kitchen_area: compliance.kitchen_area || 0,
      drawingroom_area: compliance.drawingroom_area || 0,
      carporch_area: compliance.carporch_area || 0,
      garden_area: compliance.garden_area || 0,
      // Room connections
      roomConnections: compliance.roomConnections || [],
      max_ground_coverage: compliance.max_ground_coverage,
      front_setback: compliance.front_setback,
      rear_setback: compliance.rear_setback,
      side_setback_left: compliance.side_setback_left,
      side_setback_right: compliance.side_setback_right,
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
      total_plot_area: '',
      // Room count requirements
      bedrooms: 0,
      bathrooms: 0,
      livingRooms: 0,
      kitchens: 0,
      drawingrooms: 0,
      carporches: 0,
      gardens: 0,
      // Room area requirements (sq ft per room)
      bedroom_area: 0,
      bathroom_area: 0,
      livingroom_area: 0,
      kitchen_area: 0,
      drawingroom_area: 0,
      carporch_area: 0,
      garden_area: 0,
      // Room connections
      roomConnections: [],
      max_ground_coverage: 75,
      front_setback: 10,
      rear_setback: 10,
      side_setback_left: 5,
      side_setback_right: 5,
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
    
    // Auto-populate area when marla_size is selected (compliance is area-based, not dimension-based)
    if (name === 'marla_size') {
      const dimensions = societyMarlaData ? getDimensionsForPlotSize(value, societyMarlaData) : null;
      const defaults = getPlotDefaults(value);
      
      if (dimensions) {
        const area = dimensions.x * dimensions.y;
        setFormData(prev => ({
          ...prev,
          marla_size: value,
          total_plot_area: area, // Area-based compliance applies to ALL plot dimensions of this marla size
          ...defaults
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          marla_size: value,
          ...defaults
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: ['max_ground_coverage', 'front_setback', 'rear_setback', 
                 'side_setback_left', 'side_setback_right', 'min_open_space',
                 'total_plot_area',
                 'bedrooms', 'bathrooms', 'livingRooms', 'kitchens', 'drawingrooms',
                 'carporches', 'gardens', 'bedroom_area', 'bathroom_area', 'livingroom_area',
                 'kitchen_area', 'drawingroom_area', 'carporch_area', 'garden_area'].includes(name)
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  // Generate available room options based on room counts (similar to floorplan generator)
  const getSelectedRooms = () => {
    const rooms = [];
    const roomTypes = {
      bedrooms: 'bedroom',
      bathrooms: 'bathroom', 
      livingRooms: 'livingroom',
      kitchens: 'kitchen',
      drawingrooms: 'drawingroom',
      carporches: 'carporch',
      gardens: 'garden'
    };
    
    Object.entries(roomTypes).forEach(([countField, roomType]) => {
      const count = formData[countField] || 0;
      for (let i = 0; i < count; i++) {
        rooms.push(`${roomType}-${i + 1}`);
      }
    });
    return rooms;
  };

  // Room connection management functions
  const addRoomConnection = () => {
    setFormData(prev => ({
      ...prev,
      roomConnections: [...prev.roomConnections, { from: '', to: '' }]
    }));
  };

  const removeRoomConnection = (index) => {
    setFormData(prev => ({
      ...prev,
      roomConnections: prev.roomConnections.filter((_, i) => i !== index)
    }));
  };

  const updateRoomConnection = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      roomConnections: prev.roomConnections.map((conn, i) => 
        i === index ? { ...conn, [field]: value } : conn
      )
    }));
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
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Compliance Management</h1>
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
                        â€¢ <strong>{marlaOptions.length}</strong> unique plot sizes: <span className="font-semibold text-blue-600">{marlaOptions.join(', ')}</span>
                      </span>
                    )}
                  </p>
                  {compliances.length > 0 && (
                    <p className="text-sm text-gray-700">
                      <strong>{compliances.length} of {marlaOptions.length}</strong> plot sizes have compliance rules
                      {getAvailablePlotSizes().length > 0 && (
                        <span className="ml-2">
                          â€¢ Pending: <span className="font-semibold text-orange-600">{getAvailablePlotSizes().join(', ')}</span>
                        </span>
                      )}
                      {getAvailablePlotSizes().length === 0 && marlaOptions.length > 0 && (
                        <span className="ml-2 text-green-600 font-semibold">
                          â€¢ All configured! âœ…
                        </span>
                      )}
                    </p>
                  )}
                  {compliances.length === 0 && marlaOptions.length > 0 && (
                    <p className="text-sm text-orange-600 font-medium">
                      âš ï¸ No compliance rules configured yet. Click "Add Compliance Rules" to get started.
                    </p>
                  )}
                  {marlaOptions.length === 0 && (
                    <p className="text-sm text-red-600 font-medium">
                      âš ï¸ No plots found in your society. Please add plots in Plot Management first.
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
                ðŸ“ Plot Size *
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
                  âš ï¸ All plot sizes have been configured. Edit existing rules to make changes.
                </p>
              )}
              {!editingId && getAvailablePlotSizes().length > 0 && (
                <p className="text-xs text-blue-700 mt-2 font-medium">
                  âœ¨ Auto-fills recommended values based on Pakistani building standards
                </p>
              )}
              {editingId && (
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  ðŸ“ Editing existing compliance rules for this plot size
                </p>
              )}
            </div>

            {/* Plot Size Info - Area-based compliance */}
            {formData.marla_size && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
<<<<<<< HEAD
                  📐 Plot Size Information
=======
                  ðŸ“ Plot Dimensions (Auto-filled)
>>>>>>> b2ed8bccabc69ee9803e8cc84be9d77832f9cba7
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plot Size Category
                    </label>
                    <input
                      type="text"
                      value={formData.marla_size}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Standard Area - sq ft
                    </label>
                    <input
                      type="number"
                      value={formData.total_plot_area}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>
<<<<<<< HEAD
                <p className="text-xs text-green-700 mt-3 font-medium">
                  ✅ These compliance rules apply to <strong>ALL {formData.marla_size} plots</strong> in your society, 
                  regardless of their specific dimensions (X, Y). 
                  If society wants to change plot dimensions, the total area ({formData.total_plot_area} sq ft) remains constant, 
                  and the same compliance rules will apply automatically.
=======
                <p className="text-xs text-green-700 mt-2 font-medium">
                  âœ… These dimensions are automatically filled based on standard {formData.marla_size} specifications
>>>>>>> b2ed8bccabc69ee9803e8cc84be9d77832f9cba7
                </p>
              </div>
            )}

            {/* Room Requirements */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                ðŸ  Room Count Requirements
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Living Rooms
                  </label>
                  <input
                    type="number"
                    name="livingRooms"
                    value={formData.livingRooms}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kitchens
                  </label>
                  <input
                    type="number"
                    name="kitchens"
                    value={formData.kitchens}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drawing Rooms
                  </label>
                  <input
                    type="number"
                    name="drawingrooms"
                    value={formData.drawingrooms}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Car Porches
                  </label>
                  <input
                    type="number"
                    name="carporches"
                    value={formData.carporches}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gardens
                  </label>
                  <input
                    type="number"
                    name="gardens"
                    value={formData.gardens}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                â„¹ï¸ Specify minimum room count requirements for this plot size
              </p>
            </div>

            {/* Room Area Requirements */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                ðŸ“ Room Area Requirements
              </h3>
              
              {/* Bedrooms */}
              {formData.bedrooms > 0 && (
                <div className="bg-white rounded-lg p-4 mb-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">ðŸ›ï¸ Bedrooms ({formData.bedrooms})</h4>
                    {calculateAreaBreakdown()?.roomPercentages && (
                      <span className="text-sm font-bold text-indigo-600">
                        Total: {calculateAreaBreakdown().roomPercentages.bedrooms.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: parseInt(formData.bedrooms) || 0 }, (_, index) => (
                      <div key={index}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Bedroom {index + 1} - Area (sq ft)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="80"
                            max="400"
                            step="5"
                            value={formData.bedroom_area}
                            onChange={handleChange}
                            name="bedroom_area"
                            className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            name="bedroom_area"
                            value={formData.bedroom_area}
                            onChange={handleChange}
                            min="0"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-500 min-w-[35px]">sq ft</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bathrooms */}
              {formData.bathrooms > 0 && (
                <div className="bg-white rounded-lg p-4 mb-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">ðŸš¿ Bathrooms ({formData.bathrooms})</h4>
                    {calculateAreaBreakdown()?.roomPercentages && (
                      <span className="text-sm font-bold text-indigo-600">
                        Total: {calculateAreaBreakdown().roomPercentages.bathrooms.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: parseInt(formData.bathrooms) || 0 }, (_, index) => (
                      <div key={index}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Bathroom {index + 1} - Area (sq ft)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="30"
                            max="150"
                            step="5"
                            value={formData.bathroom_area}
                            onChange={handleChange}
                            name="bathroom_area"
                            className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            name="bathroom_area"
                            value={formData.bathroom_area}
                            onChange={handleChange}
                            min="0"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-500 min-w-[35px]">sq ft</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Living Rooms */}
              {formData.livingRooms > 0 && (
                <div className="bg-white rounded-lg p-4 mb-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">ðŸ›‹ï¸ Living Rooms ({formData.livingRooms})</h4>
                    {calculateAreaBreakdown()?.roomPercentages && (
                      <span className="text-sm font-bold text-indigo-600">
                        Total: {calculateAreaBreakdown().roomPercentages.livingRooms.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: parseInt(formData.livingRooms) || 0 }, (_, index) => (
                      <div key={index}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Living Room {index + 1} - Area (sq ft)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="150"
                            max="500"
                            step="10"
                            value={formData.livingroom_area}
                            onChange={handleChange}
                            name="livingroom_area"
                            className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            name="livingroom_area"
                            value={formData.livingroom_area}
                            onChange={handleChange}
                            min="0"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-500 min-w-[35px]">sq ft</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kitchens */}
              {formData.kitchens > 0 && (
                <div className="bg-white rounded-lg p-4 mb-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">ðŸ³ Kitchens ({formData.kitchens})</h4>
                    {calculateAreaBreakdown()?.roomPercentages && (
                      <span className="text-sm font-bold text-indigo-600">
                        Total: {calculateAreaBreakdown().roomPercentages.kitchens.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: parseInt(formData.kitchens) || 0 }, (_, index) => (
                      <div key={index}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Kitchen {index + 1} - Area (sq ft)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="60"
                            max="300"
                            step="5"
                            value={formData.kitchen_area}
                            onChange={handleChange}
                            name="kitchen_area"
                            className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            name="kitchen_area"
                            value={formData.kitchen_area}
                            onChange={handleChange}
                            min="0"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-500 min-w-[35px]">sq ft</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drawing Rooms */}
              {formData.drawingrooms > 0 && (
                <div className="bg-white rounded-lg p-4 mb-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">ðŸŽ¨ Drawing Rooms ({formData.drawingrooms})</h4>
                    {calculateAreaBreakdown()?.roomPercentages && (
                      <span className="text-sm font-bold text-indigo-600">
                        Total: {calculateAreaBreakdown().roomPercentages.drawingrooms.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: parseInt(formData.drawingrooms) || 0 }, (_, index) => (
                      <div key={index}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Drawing Room {index + 1} - Area (sq ft)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="100"
                            max="400"
                            step="10"
                            value={formData.drawingroom_area}
                            onChange={handleChange}
                            name="drawingroom_area"
                            className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            name="drawingroom_area"
                            value={formData.drawingroom_area}
                            onChange={handleChange}
                            min="0"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-500 min-w-[35px]">sq ft</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Car Porches */}
              {formData.carporches > 0 && (
                <div className="bg-white rounded-lg p-4 mb-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">ðŸš— Car Porches ({formData.carporches})</h4>
                    {calculateAreaBreakdown()?.roomPercentages && (
                      <span className="text-sm font-bold text-indigo-600">
                        Total: {calculateAreaBreakdown().roomPercentages.carporches.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: parseInt(formData.carporches) || 0 }, (_, index) => (
                      <div key={index}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Car Porch {index + 1} - Area (sq ft)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="100"
                            max="400"
                            step="10"
                            value={formData.carporch_area}
                            onChange={handleChange}
                            name="carporch_area"
                            className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            name="carporch_area"
                            value={formData.carporch_area}
                            onChange={handleChange}
                            min="0"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-500 min-w-[35px]">sq ft</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gardens */}
              {formData.gardens > 0 && (
                <div className="bg-white rounded-lg p-4 mb-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">ðŸŒ³ Gardens ({formData.gardens})</h4>
                    {calculateAreaBreakdown()?.roomPercentages && (
                      <span className="text-sm font-bold text-indigo-600">
                        Total: {calculateAreaBreakdown().roomPercentages.gardens.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: parseInt(formData.gardens) || 0 }, (_, index) => (
                      <div key={index}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Garden {index + 1} - Area (sq ft)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="50"
                            max="500"
                            step="10"
                            value={formData.garden_area}
                            onChange={handleChange}
                            name="garden_area"
                            className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            name="garden_area"
                            value={formData.garden_area}
                            onChange={handleChange}
                            min="0"
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-500 min-w-[35px]">sq ft</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-indigo-700 mt-2">
                â„¹ï¸ Use sliders to adjust room areas. Percentages update automatically based on ground coverage.
              </p>
            </div>

            {/* Room Connections */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                ðŸ”— Room Connection Requirements
              </h3>
              <div className="space-y-3">
                {formData.roomConnections.length === 0 && getSelectedRooms().length >= 2 && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No room connections defined yet.</p>
                    <p className="text-xs mt-1">Click "Add Room Connection" to define which rooms should be connected.</p>
                  </div>
                )}
                
                {getSelectedRooms().length < 2 && (
                  <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-md">
                    <p className="text-sm font-medium">âš ï¸ Need at least 2 rooms to create connections</p>
                    <p className="text-xs mt-1">Add room counts above to enable connections</p>
                  </div>
                )}
                
                {formData.roomConnections.map((connection, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-3 rounded border">
                    <select
                      value={connection.from}
                      onChange={(e) => updateRoomConnection(index, 'from', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select room...</option>
                      {getSelectedRooms().map(roomTag => (
                        <option key={roomTag} value={roomTag}>
                          {roomTag.replace('-', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-500">â†’</span>
                    <select
                      value={connection.to}
                      onChange={(e) => updateRoomConnection(index, 'to', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select room...</option>
                      {getSelectedRooms().map(roomTag => (
                        <option key={roomTag} value={roomTag}>
                          {roomTag.replace('-', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeRoomConnection(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRoomConnection}
                  disabled={getSelectedRooms().length < 2}
                  className={`w-full px-4 py-2 border rounded-md transition-colors flex items-center justify-center gap-2 ${
                    getSelectedRooms().length < 2 
                      ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed' 
                      : 'text-purple-600 border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <FiPlus size={16} />
                  Add Room Connection
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-purple-700 mt-2">
                <span>â„¹ï¸ Define which rooms must be connected (for doorways/passages)</span>
                {getSelectedRooms().length >= 2 && (
                  <span className="font-medium">
                    Available: {getSelectedRooms().length} rooms | 
                    Connections: {formData.roomConnections.filter(conn => conn.from && conn.to).length}
                  </span>
                )}
              </div>
            </div>

            {/* Area Breakdown Analysis */}
            {(() => {
              const areaBreakdown = calculateAreaBreakdown();
              return areaBreakdown && (
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    ðŸ“Š Area Utilization Analysis
                  </h3>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-blue-600">{areaBreakdown.totalPlotArea.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 font-medium">Total Plot Area (sq ft)</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-green-600">{areaBreakdown.groundCoverageArea.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 font-medium">Buildable Area (sq ft)</div>
                      <div className="text-xs text-green-600">{formData.max_ground_coverage}% coverage</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-orange-600">{areaBreakdown.totalRoomArea.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 font-medium">Room Area Used (sq ft)</div>
                      <div className="text-xs text-orange-600">{areaBreakdown.utilizationPercentage.toFixed(1)}% utilized</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                      <div className={`text-2xl font-bold ${areaBreakdown.remainingArea > 0 ? 'text-teal-600' : 'text-red-600'}`}>
                        {areaBreakdown.remainingArea.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">Remaining Area (sq ft)</div>
                      {areaBreakdown.remainingArea < 0 && (
                        <div className="text-xs text-red-600 font-medium">âš ï¸ Over capacity!</div>
                      )}
                    </div>
                  </div>

                  {/* Detailed Room Breakdown */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3">Room Area Breakdown:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {Object.entries(areaBreakdown.roomAreas).map(([roomType, area]) => {
                        if (area === 0) return null;
                        const roomNames = {
                          bedrooms: 'ðŸ›ï¸ Bedrooms',
                          bathrooms: 'ðŸš¿ Bathrooms', 
                          livingRooms: 'ðŸ›‹ï¸ Living Rooms',
                          kitchens: 'ðŸ´ Kitchens',
                          drawingrooms: 'ðŸŽ¨ Drawing Rooms',
                          carporches: 'ðŸš— Car Porches',
                          gardens: 'ðŸŒ³ Gardens'
                        };
                        return (
                          <div key={roomType} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-gray-700">{roomNames[roomType]}:</span>
                            <span className="font-bold text-gray-800">{area.toLocaleString()} sq ft</span>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  </div>

                  {/* Setback Area Info */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Setback Area Analysis:</h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">ðŸ“ Total Setback Area:</span>
                      <span className="font-bold text-indigo-600">{areaBreakdown.setbackArea.toLocaleString()} sq ft</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Non-buildable area reserved for setbacks from plot boundaries
                    </div>
                  </div>

                  {/* Status Messages */}
                  {areaBreakdown.remainingArea < 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-4">
                      <div className="flex items-center gap-2 text-red-700 font-medium">
                        âš ï¸ Area Exceeded!
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        Room allocations exceed available buildable area by {Math.abs(areaBreakdown.remainingArea).toLocaleString()} sq ft. 
                        Consider reducing room counts or areas.
                      </div>
                    </div>
                  )}
                  
                  {areaBreakdown.remainingArea > 0 && areaBreakdown.utilizationPercentage < 50 && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
                      <div className="flex items-center gap-2 text-blue-700 font-medium">
                        ðŸ’¡ Optimization Opportunity
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        You're using only {areaBreakdown.utilizationPercentage.toFixed(1)}% of buildable area. 
                        Consider adding more rooms or increasing room sizes.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Ground Floor Coverage */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                ðŸ—ï¸ Maximum Ground Coverage (%) *
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
                ðŸ’¡ <strong>Pakistani Standards:</strong> 5 Marla=75%, 7 Marla=72%, 10 Marla=70%, 1 Kanal=65%, 2 Kanal=60%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This ensures mandatory open spaces for setbacks, garden, and parking
              </p>
            </div>

            {/* Mandatory Setbacks */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                ðŸ“ Mandatory Setback Requirements (feet)
              </h3>
              <p className="text-sm text-gray-600 mb-4">Empty space that must be left from plot boundaries</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ðŸ”¼ Front *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ðŸ”½ Rear *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">â—€ï¸ Left Side *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">â–¶ï¸ Right Side *</label>
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
                <span className="text-gray-700 font-medium">ðŸ—ï¸ Ground Coverage:</span>
                <span className="font-bold text-orange-600">{compliance.max_ground_coverage}%</span>
              </div>
              
              {/* Room Count Requirements */}
              {(compliance.bedrooms > 0 || compliance.bathrooms > 0 || compliance.livingRooms > 0 || compliance.kitchens > 0) && (
                <div className="p-2 bg-purple-50 rounded">
                  <div className="text-gray-600 font-medium mb-2">ðŸ  Room Requirements:</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {compliance.bedrooms > 0 && (
                      <div className="flex justify-between">
                        <span>ðŸ›ï¸ Bedrooms:</span>
                        <span className="font-bold text-purple-600">{compliance.bedrooms} ({compliance.bedroom_area || 0} sq ft each)</span>
                      </div>
                    )}
                    {compliance.bathrooms > 0 && (
                      <div className="flex justify-between">
                        <span>ðŸš¿ Bathrooms:</span>
                        <span className="font-bold text-purple-600">{compliance.bathrooms} ({compliance.bathroom_area || 0} sq ft each)</span>
                      </div>
                    )}
                    {compliance.livingRooms > 0 && (
                      <div className="flex justify-between">
                        <span>ðŸ›‹ï¸ Living Rooms:</span>
                        <span className="font-bold text-purple-600">{compliance.livingRooms} ({compliance.livingroom_area || 0} sq ft each)</span>
                      </div>
                    )}
                    {compliance.kitchens > 0 && (
                      <div className="flex justify-between">
                        <span>ðŸ´ Kitchens:</span>
                        <span className="font-bold text-purple-600">{compliance.kitchens} ({compliance.kitchen_area || 0} sq ft each)</span>
                      </div>
                    )}
                    {compliance.drawingrooms > 0 && (
                      <div className="flex justify-between">
                        <span>ðŸŽ¨ Drawing Rooms:</span>
                        <span className="font-bold text-purple-600">{compliance.drawingrooms} ({compliance.drawingroom_area || 0} sq ft each)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Outdoor Spaces */}
              {(compliance.gardens > 0 || compliance.carporches > 0) && (
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-gray-600 font-medium mb-2">ðŸŒ¿ Outdoor Spaces:</div>
                  <div className="space-y-1 text-xs">
                    {compliance.gardens > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">ðŸŒ³ Gardens:</span>
                        <span className="font-bold text-green-600">{compliance.gardens} ({compliance.garden_area || 0} sq ft each)</span>
                      </div>
                    )}
                    {compliance.carporches > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">ðŸš— Car Porches:</span>
                        <span className="font-bold text-blue-600">{compliance.carporches} ({compliance.carporch_area || 0} sq ft each)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Room Connections */}
              {compliance.roomConnections && compliance.roomConnections.length > 0 && (
                <div className="p-2 bg-indigo-50 rounded">
                  <div className="text-gray-600 font-medium mb-2">ðŸ”— Room Connections:</div>
                  <div className="space-y-1 text-xs">
                    {compliance.roomConnections.slice(0, 3).map((connection, index) => (
                      <div key={index} className="text-indigo-600">
                        {connection.from?.replace('-', ' ').toUpperCase()} â†’ {connection.to?.replace('-', ' ').toUpperCase()}
                      </div>
                    ))}
                    {compliance.roomConnections.length > 3 && (
                      <div className="text-indigo-500 text-xs">
                        +{compliance.roomConnections.length - 3} more connections
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700 font-medium">ðŸ“ Setbacks:</span>
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
