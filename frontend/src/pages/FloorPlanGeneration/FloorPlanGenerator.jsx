import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import KonvaFloorPlan from '../../components/FloorPlan/KonvaFloorPlan';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import jsPDF from 'jspdf';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FloorPlanGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const stageRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 560 });

  // Measure the canvas container on mount and resize
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Get template creation flag from location state
  const isCreatingTemplate = location.state?.isCreatingTemplate || false;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [totalAreaPercentage, setTotalAreaPercentage] = useState(0);
  const [availableAreaPercentage, setAvailableAreaPercentage] = useState(100);
  const [areaDistributionMode, setAreaDistributionMode] = useState('auto'); // 'auto' or 'manual'
  const [generatingEngine, setGeneratingEngine] = useState(null); // Track which engine is currently generating: 'ga' or 'genai'
  const [societyCompliances, setSocietyCompliances] = useState([]);
  const [loadingCompliances, setLoadingCompliances] = useState(true);
  
  // Genetic Algorithm Parameters State
  const [gaParams, setGaParams] = useState({
    populationSize: 20,
    mutationRate: 0.1,
    crossoverRate: 0.7
  });

  // Tab navigation state for compact layout
  const [activeTab, setActiveTab] = useState('plot'); // 'plot', 'rooms', 'connections'

  const [formData, setFormData] = useState({
    // Use sensible default strings to avoid controlled/uncontrolled warnings in number inputs
    plotDimensions: { width: '1000', height: '1000' },
    roomConfiguration: {
      livingroom: { count: 0, areaPercentage: 0, individualAreas: [] },
      kitchen: { count: 0, areaPercentage: 0, individualAreas: [] },
      bedroom: { count: 0, areaPercentage: 0, individualAreas: [] },
      bathroom: { count: 0, areaPercentage: 0, individualAreas: [] },
      carporch: { count: 0, areaPercentage: 0, individualAreas: [] },
      garden: { count: 0, areaPercentage: 0, individualAreas: [] },
      drawingroom: { count: 0, areaPercentage: 0, individualAreas: [] }
    },
    roomConnections: [] // Array of {from: roomTag, to: roomTag} objects
  });

  const [collapsedSections, setCollapsedSections] = useState({
    dimensions: false,
    rooms: false,
    areas: false,
    connections: false
  });

  // Fetch society compliances to show only available plot sizes
  useEffect(() => {
    const fetchSocietyCompliances = async () => {
      try {
        setLoadingCompliances(true);
        const societyId = user?.societyId || user?.id || user?._id;
        
        if (!societyId) {
          console.log('[FloorPlanGenerator] No society ID found');
          setLoadingCompliances(false);
          return;
        }

        const response = await axios.get(`${API_URL}/compliance/society/${societyId}`);
        
        if (response.data.success && response.data.data) {
          setSocietyCompliances(response.data.data);
          console.log('[FloorPlanGenerator] Loaded compliances:', response.data.data);
        }
      } catch (error) {
        console.error('[FloorPlanGenerator] Error fetching compliances:', error);
      } finally {
        setLoadingCompliances(false);
      }
    };

    fetchSocietyCompliances();
  }, [user]);

  // If coming from an approval request, import external JSON floor plan
  useEffect(() => {
    const importUrl = location.state?.importFromUrl;
    const importData = location.state?.importFromData;
    
    // Prefer importFromData (database) over importFromUrl (file) for cloud compatibility
    if (importData) {
      try {
        // Floor plan data directly from database (no network request needed)
        const plans = Array.isArray(importData) ? importData : [importData];
        if (plans.length > 0) {
          setGeneratedPlans(plans);
          setCurrentPlanIndex(0);
          setCurrentStep(3); // Jump directly to review/visualization step
        }
      } catch (err) {
        console.error('Failed to parse floor plan data from database:', err);
        alert('❌ Could not load floor plan data from approval request.\n\nError: ' + err.message);
      }
      return;
    }
    
    // Fallback to URL-based import for backward compatibility
    if (!importUrl) return;

    const loadImportedPlan = async () => {
      try {
        const res = await fetch(importUrl);
        
        if (!res.ok) {
          if (res.status === 404) {
            alert('❌ Floor plan file not found!\n\nThe file was referenced in the database but does not exist on the server. The file may have been deleted or never uploaded properly.\n\nPlease ask the user to re-submit their floor plan.');
          } else if (res.status === 403) {
            alert('❌ Access denied to floor plan file.');
          } else {
            alert(`❌ Error loading floor plan: ${res.status} ${res.statusText}`);
          }
          return;
        }
        
        const data = await res.json();

        // Support either a single plan object or an array of plans
        const plans = Array.isArray(data) ? data : [data];
        if (plans.length === 0) return;

        setGeneratedPlans(plans);
        setCurrentPlanIndex(0);
        setCurrentStep(3); // Jump directly to review/visualization step
      } catch (err) {
        console.error('Failed to import floor plan JSON:', err);
        alert('❌ Could not load floor plan JSON from approval request.\n\nError: ' + err.message);
      }
    };

    loadImportedPlan();
  }, [location.state]);

  // Restore state when returning from the customization page
  useEffect(() => {
    const returnedPlans = location.state?.returnedPlans;
    const returnedIndex = location.state?.returnedPlanIndex;
    if (returnedPlans && returnedPlans.length > 0) {
      setGeneratedPlans(returnedPlans);
      setCurrentPlanIndex(returnedIndex ?? 0);
      setCurrentStep(3);
    }
  }, [location.state]);

  // Apply compliance rules if coming from plot detail
  useEffect(() => {
    const plotData = location.state?.plotData;
    const complianceRules = location.state?.complianceRules;
    const fromPlotDetail = location.state?.fromPlotDetail;

    if (fromPlotDetail && plotData && complianceRules) {
      console.log('[FloorPlanGenerator] Applying compliance rules:', complianceRules);
      console.log('[FloorPlanGenerator] Plot data:', plotData);

      // Use 1000x1000 for better view/generation (consistent with normal floorplan generation)
      const width = '1000';
      const height = '1000';

      // Calculate total plot area using actual dimensions from compliance for area validation
      const actualWidth = parseFloat(complianceRules.plot_dimension_x) || parseFloat(plotData?.plot_dimension_x) || 1000;
      const actualHeight = parseFloat(complianceRules.plot_dimension_y) || parseFloat(plotData?.plot_dimension_y) || 1000;
      const totalPlotArea = actualWidth * actualHeight;
      
      // Set plot size and dimensions in UI based on plot data
      const marlaSize = plotData?.marla_size || complianceRules?.marla_size;
      if (marlaSize) {
        // Extract numeric value from marla size (e.g., "5 Marla" -> 5, "1 Kanal" -> 20)
        const marlaMatch = marlaSize.match(/(\d+)\s*Marla/i);
        const kanalMatch = marlaSize.match(/(\d+)\s*Kanal/i);
        
        let marlaNumber = null;
        if (marlaMatch) {
          marlaNumber = parseInt(marlaMatch[1]);
        } else if (kanalMatch) {
          marlaNumber = parseInt(kanalMatch[1]) * 20; // 1 Kanal = 20 Marla
        }
        
        // Check against allPlotSizes defined later in the component
        const plotSizeConfig = {
          5: { marla: 5, label: '5 Marla', sqFt: 1361.25 },
          7: { marla: 7, label: '7 Marla', sqFt: 1905.75 },
          10: { marla: 10, label: '10 Marla', sqFt: 2722.5 },
          20: { marla: 20, label: '1 Kanal', sqFt: 5445 }
        };
        
        if (marlaNumber && plotSizeConfig[marlaNumber]) {
          // Plot size exists in available sizes
          setSelectedPlotSize(marlaNumber);
          setIsCustomPlot(false);
          setPlotDimensions({ 
            length: actualWidth, 
            width: actualHeight 
          });
          console.log('[FloorPlanGenerator] Set plot size to:', marlaNumber, 'Marla with dimensions:', actualWidth, 'x', actualHeight);
        } else {
          // Custom plot size
          setIsCustomPlot(true);
          setCustomDimensions({ 
            length: actualWidth, 
            width: actualHeight 
          });
          const marlaEquivalent = (totalPlotArea / 225).toFixed(2);
          setDimensionError(`Area: ${totalPlotArea.toFixed(0)} sq ft (${marlaEquivalent} Marla)`);
          console.log('[FloorPlanGenerator] Set custom plot with dimensions:', actualWidth, 'x', actualHeight);
        }
      }
      const maxGroundCoverage = parseFloat(complianceRules.max_ground_coverage) || 75;
      const maxAllowedArea = (totalPlotArea * maxGroundCoverage) / 100;

      console.log('[FloorPlanGenerator] Total plot area:', totalPlotArea, 'sq ft');
      console.log('[FloorPlanGenerator] Max ground coverage:', maxGroundCoverage, '%');
      console.log('[FloorPlanGenerator] Max allowed area:', maxAllowedArea, 'sq ft');

      // Auto-configure room requirements based on compliance with area validation
      const newRoomConfiguration = { ...formData.roomConfiguration };
      let totalRoomArea = 0;

      // Set room counts from compliance rules and calculate percentages based on actual area
      if (complianceRules.bedrooms > 0) {
        const areaPerRoom = parseFloat(complianceRules.bedroom_area) || 120;
        const totalArea = areaPerRoom * complianceRules.bedrooms;
        totalRoomArea += totalArea;
        newRoomConfiguration.bedroom.count = complianceRules.bedrooms;
        newRoomConfiguration.bedroom.areaPercentage = (totalArea / maxAllowedArea) * 100;
        newRoomConfiguration.bedroom.individualAreas = Array(complianceRules.bedrooms).fill((areaPerRoom / maxAllowedArea) * 100);
      }

      if (complianceRules.bathrooms > 0) {
        const areaPerRoom = parseFloat(complianceRules.bathroom_area) || 45;
        const totalArea = areaPerRoom * complianceRules.bathrooms;
        totalRoomArea += totalArea;
        newRoomConfiguration.bathroom.count = complianceRules.bathrooms;
        newRoomConfiguration.bathroom.areaPercentage = (totalArea / maxAllowedArea) * 100;
        newRoomConfiguration.bathroom.individualAreas = Array(complianceRules.bathrooms).fill((areaPerRoom / maxAllowedArea) * 100);
      }

      if (complianceRules.livingRooms > 0) {
        const areaPerRoom = parseFloat(complianceRules.livingroom_area) || 200;
        const totalArea = areaPerRoom * complianceRules.livingRooms;
        totalRoomArea += totalArea;
        newRoomConfiguration.livingroom.count = complianceRules.livingRooms;
        newRoomConfiguration.livingroom.areaPercentage = (totalArea / maxAllowedArea) * 100;
        newRoomConfiguration.livingroom.individualAreas = Array(complianceRules.livingRooms).fill((areaPerRoom / maxAllowedArea) * 100);
      }

      if (complianceRules.kitchens > 0) {
        const areaPerRoom = parseFloat(complianceRules.kitchen_area) || 90;
        const totalArea = areaPerRoom * complianceRules.kitchens;
        totalRoomArea += totalArea;
        newRoomConfiguration.kitchen.count = complianceRules.kitchens;
        newRoomConfiguration.kitchen.areaPercentage = (totalArea / maxAllowedArea) * 100;
        newRoomConfiguration.kitchen.individualAreas = Array(complianceRules.kitchens).fill((areaPerRoom / maxAllowedArea) * 100);
      }

      if (complianceRules.drawingrooms > 0) {
        const areaPerRoom = parseFloat(complianceRules.drawingroom_area) || 150;
        const totalArea = areaPerRoom * complianceRules.drawingrooms;
        totalRoomArea += totalArea;
        newRoomConfiguration.drawingroom.count = complianceRules.drawingrooms;
        newRoomConfiguration.drawingroom.areaPercentage = (totalArea / maxAllowedArea) * 100;
        newRoomConfiguration.drawingroom.individualAreas = Array(complianceRules.drawingrooms).fill((areaPerRoom / maxAllowedArea) * 100);
      }

      if (complianceRules.carporches > 0) {
        const areaPerRoom = parseFloat(complianceRules.carporch_area) || 200;
        const totalArea = areaPerRoom * complianceRules.carporches;
        totalRoomArea += totalArea;
        newRoomConfiguration.carporch.count = complianceRules.carporches;
        newRoomConfiguration.carporch.areaPercentage = (totalArea / maxAllowedArea) * 100;
        newRoomConfiguration.carporch.individualAreas = Array(complianceRules.carporches).fill((areaPerRoom / maxAllowedArea) * 100);
      }

      if (complianceRules.gardens > 0) {
        const areaPerRoom = parseFloat(complianceRules.garden_area) || 150;
        const totalArea = areaPerRoom * complianceRules.gardens;
        totalRoomArea += totalArea;
        newRoomConfiguration.garden.count = complianceRules.gardens;
        newRoomConfiguration.garden.areaPercentage = (totalArea / maxAllowedArea) * 100;
        newRoomConfiguration.garden.individualAreas = Array(complianceRules.gardens).fill((areaPerRoom / maxAllowedArea) * 100);
      }

      // Validate total area does not exceed maximum allowed coverage
      const totalPercentage = Object.values(newRoomConfiguration).reduce((sum, room) => sum + (room.areaPercentage || 0), 0);
      
      console.log('[FloorPlanGenerator] Total room area:', totalRoomArea, 'sq ft');
      console.log('[FloorPlanGenerator] Total percentage:', totalPercentage, '%');
      console.log('[FloorPlanGenerator] Max allowed area:', maxAllowedArea, 'sq ft');

      // Check if total room area exceeds allowed coverage
      if (totalRoomArea > maxAllowedArea) {
        const exceededBy = totalRoomArea - maxAllowedArea;
        const exceededPercentage = ((totalRoomArea / maxAllowedArea) * 100) - 100;
        
        alert(
          `⚠️ AREA COVERAGE EXCEEDED!\n\n` +
          `Total Room Area: ${totalRoomArea.toFixed(0)} sq ft\n` +
          `Maximum Allowed (${maxGroundCoverage}% coverage): ${maxAllowedArea.toFixed(0)} sq ft\n` +
          `Exceeded by: ${exceededBy.toFixed(0)} sq ft (${exceededPercentage.toFixed(1)}%)\n\n` +
          `❌ Cannot generate floor plan with these compliance rules.\n\n` +
          `Please contact your society administrator to adjust the compliance rules for ${complianceRules.marla_size} plots.\n\n` +
          `Suggestions:\n` +
          `• Reduce individual room areas\n` +
          `• Reduce number of rooms\n` +
          `• Increase ground coverage percentage\n` +
          `• Increase plot dimensions`
        );
        
        // Navigate back to prevent generation
        navigate(-1);
        return;
      }

      // Set room connections from compliance rules
      const roomConnections = complianceRules.roomConnections || [];

      // Update form data with compliance-based configuration
      setFormData({
        plotDimensions: { width: width.toString(), height: height.toString() },
        roomConfiguration: newRoomConfiguration,
        roomConnections: roomConnections
      });

      console.log('[FloorPlanGenerator] Applied compliance configuration:', {
        dimensions: { width, height },
        roomConfiguration: newRoomConfiguration,
        roomConnections: roomConnections,
        totalPercentage: Object.values(newRoomConfiguration).reduce((sum, room) => sum + (room.areaPercentage || 0), 0)
      });
    }
  }, [location.state]);

  // Auto-calculate total and available area whenever room configuration changes
  useEffect(() => {
    const total = calculateTotalAreaPercentage(formData.roomConfiguration);
    const available = calculateAvailableArea(formData.roomConfiguration);
    setTotalAreaPercentage(total);
    setAvailableAreaPercentage(available);
  }, [formData.roomConfiguration]);

  const roomTypes = [
    { key: 'livingroom', label: 'Living Room', defaultArea: 25 },
    { key: 'kitchen', label: 'Kitchen', defaultArea: 15 },
    { key: 'bedroom', label: 'Bedroom', defaultArea: 20 },
    { key: 'bathroom', label: 'Bathroom', defaultArea: 8 },
    { key: 'carporch', label: 'Car Porch', defaultArea: 10 },
    { key: 'garden', label: 'Garden', defaultArea: 12 },
    { key: 'drawingroom', label: 'Drawing Room', defaultArea: 10 }
  ];

  // Room color helper - matches KonvaFloorPlan colors
  const getRoomColor = (roomType) => {
    const colors = {
      'livingroom': '#FFE4E9',    // Light Pink - Living
      'bedroom': '#E8F8E8',       // Light Green - Bedroom
      'kitchen': '#FFF9C4',       // Light Yellow - Kitchen
      'bathroom': '#E3F2FD',      // Light Blue - Bathroom
      'drawingroom': '#FFF0E0',   // Light Peach - Drawing
      'carporch': '#F3F0FF',      // Light Lavender - Car Porch
      'garden': '#E8F0F8'         // Light Steel Blue - Garden
    };
    
    if (!roomType) return '#F0F0F0';
    const type = (roomType.split('-')[0] || '').toLowerCase();
    return colors[type] || '#F0F0F0';
  };

  // Calculate total area percentage
  const calculateTotalAreaPercentage = useCallback((roomConfig) => {
    return Object.values(roomConfig).reduce((total, room) => {
      return total + (room.areaPercentage || 0);
    }, 0);
  }, []);

  // Calculate available area percentage
  const calculateAvailableArea = useCallback((roomConfig) => {
    const total = calculateTotalAreaPercentage(roomConfig);
    return Math.max(0, 100 - total);
  }, [calculateTotalAreaPercentage]);

  // Rebalance all room percentages to maintain 100% total
  const rebalanceAreaDistribution = useCallback((roomConfig, excludeRoomType = null, newPercentage = null) => {
    const totalCurrent = calculateTotalAreaPercentage(roomConfig);
    
    // If we're setting a specific room's percentage
    if (excludeRoomType && newPercentage !== null) {
      const remainingPercentage = 100 - newPercentage;
      const currentOthersTotal = totalCurrent - (roomConfig[excludeRoomType]?.areaPercentage || 0);
      
      if (currentOthersTotal === 0) return roomConfig;
      
      const rebalancedConfig = { ...roomConfig };
      
      // Proportionally adjust other room types
      Object.keys(rebalancedConfig).forEach(roomType => {
        if (roomType !== excludeRoomType && rebalancedConfig[roomType].count > 0) {
          const currentPercent = rebalancedConfig[roomType].areaPercentage || 0;
          const newPercent = (currentPercent / currentOthersTotal) * remainingPercentage;
          
          rebalancedConfig[roomType] = {
            ...rebalancedConfig[roomType],
            areaPercentage: newPercent,
            individualAreas: distributeAreaAmongRooms(newPercent, rebalancedConfig[roomType].count)
          };
        }
      });
      
      return rebalancedConfig;
    }
    
    // Auto-rebalance all room types to 100%
    if (totalCurrent === 0) return roomConfig;
    
    const scaleFactor = 100 / totalCurrent;
    const rebalancedConfig = { ...roomConfig };
    
    Object.keys(rebalancedConfig).forEach(roomType => {
      if (rebalancedConfig[roomType].count > 0) {
        const newPercentage = rebalancedConfig[roomType].areaPercentage * scaleFactor;
        rebalancedConfig[roomType] = {
          ...rebalancedConfig[roomType],
          areaPercentage: newPercentage,
          individualAreas: distributeAreaAmongRooms(newPercentage, rebalancedConfig[roomType].count)
        };
      }
    });
    
    return rebalancedConfig;
  }, [calculateTotalAreaPercentage]);

  // Distribute area percentage among individual rooms of same type
  const distributeAreaAmongRooms = useCallback((totalPercentage, roomCount) => {
    if (roomCount === 0) return [];
    const areaPerRoom = totalPercentage / roomCount;
    return new Array(roomCount).fill(areaPerRoom);
  }, []);

  // Add new room type with smart area allocation
  const addRoomTypeWithSmartAllocation = useCallback((roomType, requestedCount = 1, requestedPercentage = null) => {
    const roomTypeData = roomTypes.find(rt => rt.key === roomType);
    const defaultPercentage = requestedPercentage || roomTypeData?.defaultArea || 15;
    
    // Calculate what percentage this room type would get
    let allocatedPercentage = defaultPercentage;
    const currentTotal = calculateTotalAreaPercentage(formData.roomConfiguration);
    
    // If adding this would exceed 100%, adjust allocation strategy
    if (currentTotal + allocatedPercentage > 100) {
      const available = calculateAvailableArea(formData.roomConfiguration);
      
      if (available > 0) {
        // Take what's available
        allocatedPercentage = available;
      } else {
        // Rebalance existing rooms to make space
        allocatedPercentage = defaultPercentage;
      }
    }
    
    const newRoomConfig = {
      ...formData.roomConfiguration,
      [roomType]: {
        count: requestedCount,
        areaPercentage: allocatedPercentage,
        individualAreas: distributeAreaAmongRooms(allocatedPercentage, requestedCount)
      }
    };
    
    // Rebalance if necessary
    const finalConfig = areaDistributionMode === 'auto' 
      ? rebalanceAreaDistribution(newRoomConfig, roomType, allocatedPercentage)
      : newRoomConfig;
    
    setFormData(prev => ({
      ...prev,
      roomConfiguration: finalConfig
    }));
    
    return finalConfig;
  }, [formData.roomConfiguration, roomTypes, calculateTotalAreaPercentage, calculateAvailableArea, distributeAreaAmongRooms, rebalanceAreaDistribution, areaDistributionMode]);

  // Remove room type and rebalance
  const removeRoomTypeAndRebalance = useCallback((roomType) => {
    const newConfig = { ...formData.roomConfiguration };
    newConfig[roomType] = { count: 0, areaPercentage: 0, individualAreas: [] };
    
    const rebalancedConfig = areaDistributionMode === 'auto' 
      ? rebalanceAreaDistribution(newConfig)
      : newConfig;
    
    setFormData(prev => ({
      ...prev,
      roomConfiguration: rebalancedConfig
    }));
  }, [formData.roomConfiguration, rebalanceAreaDistribution, areaDistributionMode]);

  // Update area percentage for specific room type
  const updateRoomTypePercentage = useCallback((roomType, newPercentage) => {
    const newConfig = {
      ...formData.roomConfiguration,
      [roomType]: {
        ...formData.roomConfiguration[roomType],
        areaPercentage: newPercentage,
        individualAreas: distributeAreaAmongRooms(newPercentage, formData.roomConfiguration[roomType].count)
      }
    };
    
    const finalConfig = areaDistributionMode === 'auto'
      ? rebalanceAreaDistribution(newConfig, roomType, newPercentage)
      : newConfig;
    
    setFormData(prev => ({
      ...prev,
      roomConfiguration: finalConfig
    }));
  }, [formData.roomConfiguration, distributeAreaAmongRooms, rebalanceAreaDistribution, areaDistributionMode]);

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (section, field, value) => {
    // keep plotDimensions values as strings (controlled input), convert when sending
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateRoomConfiguration = (roomType, field, value) => {
    const currentConfig = formData.roomConfiguration[roomType];
    
    if (field === 'count') {
      const newCount = Math.max(0, parseInt(value) || 0);
      const oldCount = currentConfig.count;
      
      if (newCount === 0) {
        // Remove room type
        removeRoomTypeAndRebalance(roomType);
        return;
      }
      
      if (oldCount === 0 && newCount > 0) {
        // Adding new room type - use smart allocation
        addRoomTypeWithSmartAllocation(roomType, newCount);
        return;
      }
      
      // Updating existing room type count
      const currentPercentage = currentConfig.areaPercentage || 0;
      const newIndividualAreas = distributeAreaAmongRooms(currentPercentage, newCount);
      
      setFormData(prev => ({
        ...prev,
        roomConfiguration: {
          ...prev.roomConfiguration,
          [roomType]: {
            ...currentConfig,
            count: newCount,
            individualAreas: newIndividualAreas
          }
        }
      }));
      
    } else if (field === 'areaPercentage') {
      // Manual area percentage adjustment
      const newPercentage = Math.max(0, Math.min(100, parseFloat(value) || 0));
      updateRoomTypePercentage(roomType, newPercentage);
      
    } else if (field === 'individualArea') {
      // Individual room area adjustment
      const roomIndex = parseInt(value.index);
      const newArea = Math.max(0, parseFloat(value.area) || 0);
      
      const newIndividualAreas = [...(currentConfig.individualAreas || [])];
      newIndividualAreas[roomIndex] = newArea;
      
      const totalPercentage = newIndividualAreas.reduce((sum, area) => sum + area, 0);
      
      setFormData(prev => {
        const newConfig = {
          ...prev.roomConfiguration,
          [roomType]: {
            ...currentConfig,
            areaPercentage: totalPercentage,
            individualAreas: newIndividualAreas
          }
        };
        
        // Rebalance if in auto mode
        const finalConfig = areaDistributionMode === 'auto'
          ? rebalanceAreaDistribution(newConfig, roomType, totalPercentage)
          : newConfig;
        
        return {
          ...prev,
          roomConfiguration: finalConfig
        };
      });
      
    } else {
      // Other field updates
      setFormData(prev => ({
        ...prev,
        roomConfiguration: {
          ...prev.roomConfiguration,
          [roomType]: {
            ...currentConfig,
            [field]: Math.max(0, Math.min(100, parseFloat(value) || 0))
          }
        }
      }));
    }
  };

  const updateIndividualRoomArea = (roomType, roomIndex, area) => {
    const newArea = Math.max(0, parseFloat(area) || 0);
    updateRoomConfiguration(roomType, 'individualArea', { index: roomIndex, area: newArea });
  };

  const getSelectedRooms = () => {
    const rooms = [];
    Object.entries(formData.roomConfiguration).forEach(([roomType, config]) => {
      for (let i = 0; i < config.count; i++) {
        rooms.push(`${roomType}-${i + 1}`);
      }
    });
    return rooms;
  };

  const getTotalAreaPercentage = () => {
    return Object.values(formData.roomConfiguration).reduce((total, config) => {
      if (config.count > 0 && config.individualAreas) {
        return total + config.individualAreas.reduce((sum, area) => sum + area, 0);
      }
      return total + (config.count > 0 ? config.areaPercentage : 0);
    }, 0);
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

  // Plot size configurations (1 marla = 272.25 sq ft)
  const allPlotSizes = {
    5: { marla: 5, label: '5 Marla', sqFt: 1361.25, commonDimensions: [
      { length: 55, width: 25 },
      { length: 54, width: 25.2 },
      { length: 50, width: 27 }
    ]},
    7: { marla: 7, label: '7 Marla', sqFt: 1905.75, commonDimensions: [
      { length: 65, width: 30 },
      { length: 55, width: 35 },
      { length: 58, width: 33 }
    ]},
    10: { marla: 10, label: '10 Marla', sqFt: 2722.5, commonDimensions: [
      { length: 78, width: 35 },
      { length: 68, width: 40 },
      { length: 60, width: 45 }
    ]},
    20: { marla: 20, label: '1 Kanal', sqFt: 5445, commonDimensions: [
      { length: 99, width: 55 },
      { length: 90, width: 60 },
      { length: 84, width: 65 }
    ]}
  };

  // Get available plot sizes based on society compliances
  const getAvailablePlotSizes = () => {
    if (loadingCompliances || societyCompliances.length === 0) {
      // Return all sizes if no compliances configured yet
      return allPlotSizes;
    }

    // Map compliance marla_size to plot size numbers
    const marlaMap = {
      '5 Marla': 5,
      '7 Marla': 7,
      '10 Marla': 10,
      '1 Kanal': 20,
      '2 Kanal': 40
    };

    const availableSizes = {};
    societyCompliances.forEach(compliance => {
      const marlaNum = marlaMap[compliance.marla_size];
      if (marlaNum && allPlotSizes[marlaNum]) {
        availableSizes[marlaNum] = allPlotSizes[marlaNum];
      }
    });

    return Object.keys(availableSizes).length > 0 ? availableSizes : allPlotSizes;
  };

  const plotSizes = getAvailablePlotSizes();
  
  const [selectedPlotSize, setSelectedPlotSize] = useState(() => {
    const available = Object.keys(plotSizes);
    return available.length > 0 ? parseInt(available[0]) : 10;
  });
  const [plotDimensions, setPlotDimensions] = useState({ length: 55, width: 25 });
  const [dimensionError, setDimensionError] = useState('');
  const [isCustomPlot, setIsCustomPlot] = useState(false);
  const [customDimensions, setCustomDimensions] = useState({ length: 26, width: 26 }); // 676 sq ft (3.01 Marla)

  // Custom plot dimension handling with minimum area constraint (3 Marla = 675 sq ft)
  const handleCustomDimensionChange = (dimension, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setDimensionError('Please enter a valid positive number');
      return;
    }

    const minArea = 675; // 3 Marla minimum
    const oppositeDim = dimension === 'length' ? 'width' : 'length';
    const currentOppositeDimension = dimension === 'length' ? customDimensions.width : customDimensions.length;
    const proposedArea = numValue * currentOppositeDimension;
    
    if (proposedArea >= minArea) {
      // Area is acceptable, allow the change without auto-adjustment
      setCustomDimensions({
        ...customDimensions,
        [dimension]: numValue
      });
      
      const totalArea = numValue * currentOppositeDimension;
      const marlaEquivalent = (totalArea / 225).toFixed(2);
      setDimensionError(`Area: ${totalArea.toFixed(0)} sq ft (${marlaEquivalent} Marla)`);
    } else {
      // Area would be too small, auto-calculate opposite dimension to meet minimum
      const calculatedValue = Math.ceil(minArea / numValue * 10) / 10; // Round up to 1 decimal
      
      setCustomDimensions({
        [dimension]: numValue,
        [oppositeDim]: calculatedValue
      });
      
      const totalArea = numValue * calculatedValue;
      const marlaEquivalent = (totalArea / 225).toFixed(2);
      setDimensionError(`Auto-adjusted ${oppositeDim} to ${calculatedValue}ft to meet minimum 3 Marla (${totalArea.toFixed(0)} sq ft / ${marlaEquivalent} Marla)`);
    }
  };

  // Calculate opposite dimension based on area constraint (in sq ft)
  const calculateOppositeDimension = (knownDimension, value, plotSize) => {
    const maxArea = plotSizes[plotSize].sqFt;
    const oppositeDimension = maxArea / value;
    return Math.round(oppositeDimension * 10) / 10; // Round to 1 decimal place
  };

  // Handle dimension changes with area validation
  const handleDimensionChange = (dimension, value) => {
    if (isCustomPlot) {
      handleCustomDimensionChange(dimension, value);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setDimensionError('Please enter a valid positive number');
      return;
    }

    const maxArea = plotSizes[selectedPlotSize].sqFt;
    const currentDimensions = isCustomPlot ? customDimensions : plotDimensions;
    const currentArea = dimension === 'length' 
      ? numValue * currentDimensions.width 
      : currentDimensions.length * numValue;

    if (currentArea > maxArea) {
      // Auto-calculate the opposite dimension to fit within area limit
      const oppositeDim = dimension === 'length' ? 'width' : 'length';
      const calculatedValue = calculateOppositeDimension(dimension, numValue, selectedPlotSize);
      
      setPlotDimensions({
        ...plotDimensions,
        [dimension]: numValue,
        [oppositeDim]: calculatedValue
      });
      
      setDimensionError(`Adjusted ${oppositeDim} to ${calculatedValue}ft to fit ${selectedPlotSize} marla limit`);
    } else {
      setPlotDimensions({
        ...plotDimensions,
        [dimension]: numValue
      });
      setDimensionError('');
    }
  };

  // Handle plot size change
  const handlePlotSizeChange = (value) => {
    if (value === 'custom') {
      setIsCustomPlot(true);
      setDimensionError(`Area: ${customDimensions.length * customDimensions.width} sq ft (${(customDimensions.length * customDimensions.width / 225).toFixed(2)} Marla)`);
    } else {
      const marlaSize = parseInt(value);
      setIsCustomPlot(false);
      setSelectedPlotSize(marlaSize);
      const defaultDimensions = plotSizes[marlaSize].commonDimensions[0];
      setPlotDimensions(defaultDimensions);
      setDimensionError('');
    }
  };

  // Helper function to create a simplified floor plan preview
  const createFloorPlanPreview = (plan) => {
    if (!plan) {
      return null;
    }
    
    // Get mapData directly from plan - ensure we're using THIS plan's data
    const mapData = plan.mapData || plan.map;

    if (!mapData || mapData.length === 0) {
      return null;
    }
    
    // Extract only label items (rooms) from THIS plan's mapData
    const rooms = mapData.filter(item => item.type === 'label' && item.label);

    // Define room colors based on type
    const roomColors = {
      'livingroom': '#A8D5FF',
      'bedroom': '#FFCCE5',
      'kitchen': '#FFE5CC',
      'bathroom': '#D4F1D4',
      'drawingroom': '#FFDFBA',
      'carporch': '#E0BBE4',
      'garden': '#C7CEEA',
      'default': '#F0F0F0'
    };

    // Scale factor to fit 1000x1000 plot into 120x100 thumbnail
    const scale = 0.12;
    const viewWidth = 130;
    const viewHeight = 110;

    return (
      <svg 
        key={`svg-${plan.id}`}
        width={viewWidth} 
        height={viewHeight} 
        viewBox="0 0 130 110" 
        className="border border-gray-300 rounded"
      >
        {/* Background */}
        <rect x="0" y="0" width="130" height="110" fill="#ffffff" stroke="#dee2e6" strokeWidth="1"/>
        
        {/* Render rooms from THIS plan's data */}
        {rooms.map((room, index) => {
            // Extract room coordinates from label item
            // x1, y1 = top-left corner, x2, y2 = top-right, x3, y3 = bottom-left, x4, y4 = bottom-right
            // Add small overlap (0.5px) to eliminate gaps between adjacent rooms
            const x = room.x1 * scale + 5 - 0.5;
            const y = room.y1 * scale + 5 - 0.5;
            const width = (room.x2 - room.x1) * scale + 1;
            const height = (room.y3 - room.y1) * scale + 1;
            
            // Extract room type from label
            const roomType = (room.label || '').split('-')[0].toLowerCase();
            const color = roomColors[roomType] || roomColors.default;
            
            return (
              <g key={`plan-${plan.id}-room-${room.label}-${room.x1}-${room.y1}`}>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={color}
                  stroke={color}
                  strokeWidth="0"
                />
                <text
                  x={x + width / 2}
                  y={y + height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="7"
                  fill="#333"
                  fontWeight="600"
                >
                  {roomType.charAt(0).toUpperCase()}
                </text>
              </g>
            );
          })
        }
        
        {/* Fallback: If no map data, try rooms array */}
        {(!mapData || mapData.filter(item => item.type === 'label').length === 0) && plan.rooms && plan.rooms.map((room, index) => {
          let x, y, width, height, roomType, color;
          
          // Check GA format - array with 5 elements: [[x1,y1], [x2,y2], [x3,y3], [x4,y4], "tag"]
          if (Array.isArray(room) && room.length === 5 && Array.isArray(room[0])) {
            const [p0, p1, p2, p3, tag] = room;
            roomType = (tag || '').split('-')[0].toLowerCase();
            color = roomColors[roomType] || roomColors.default;
            x = (p0[0] * scale) + 5 - 0.5;
            y = (p0[1] * scale) + 5 - 0.5;
            width = Math.abs(p1[0] - p0[0]) * scale + 1;
            height = Math.abs(p2[1] - p0[1]) * scale + 1;
          }
          // Object format
          else if (room && typeof room === 'object' && room.x !== undefined) {
            x = (room.x * scale) + 5 - 0.5;
            y = (room.y * scale) + 5 - 0.5;
            width = (room.width || 100) * scale + 1;
            height = (room.height || 100) * scale + 1;
            roomType = (room.type || room.tag || '').split('-')[0].toLowerCase();
            color = roomColors[roomType] || roomColors.default;
          } else {
            return null;
          }
          
          if (!width || !height || width < 0 || height < 0) return null;
          
          return (
            <g key={`fallback-room-${index}`}>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
                stroke={color}
                strokeWidth="0"
              />
              <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7"
                fill="#333"
                fontWeight="600"
              >
                {roomType ? roomType.charAt(0).toUpperCase() : 'R'}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const updateRoomConnection = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      roomConnections: prev.roomConnections.map((conn, i) => 
        i === index ? { ...conn, [field]: value } : conn
      )
    }));
  };

  // Navigation functions for floor plans
  const nextPlan = () => {
    if (currentPlanIndex < generatedPlans.length - 1) {
      setCurrentPlanIndex(currentPlanIndex + 1);
    }
  };

  const prevPlan = () => {
    if (currentPlanIndex > 0) {
      setCurrentPlanIndex(currentPlanIndex - 1);
    }
  };

  const goToPlan = (index) => {
    setCurrentPlanIndex(index);
  };

  // Handle room updates from Konva canvas


  // Send updated floor plan data back to genetic algorithm
  const sendUpdatesToBackend = async () => {
    const currentPlan = generatedPlans[currentPlanIndex];
    if (!currentPlan) return;

    try {
      const updateData = {
        planId: currentPlan.id,
        rooms: currentPlan.rooms,
        constraints: formData.roomConnections,
        plotDimensions: { width: 1000, height: 1000 }  // Use coordinate system dimensions
      };

      console.log('Sending updates to backend:', updateData);

      const response = await fetch('http://localhost:5000/api/floorplan/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backend update response:', result);
        
        // Update the plan with new genetic algorithm optimization
        if (result.optimizedPlan) {
          setGeneratedPlans(prevPlans => {
            const updatedPlans = [...prevPlans];
            updatedPlans[currentPlanIndex] = {
              ...updatedPlans[currentPlanIndex],
              ...result.optimizedPlan,
              fitness: result.optimizedPlan.fitness || updatedPlans[currentPlanIndex].fitness
            };
            return updatedPlans;
          });
        }
        
        setHasUnsavedChanges(false);
        alert('Floor plan updated successfully!');
      } else {
        console.error('Failed to update floor plan');
        alert('Failed to update floor plan. Please try again.');
      }
    } catch (error) {
      console.error('Error updating floor plan:', error);
      alert('Error updating floor plan. Please try again.');
    }
  };

  // Navigate to customization page
  const navigateToCustomization = () => {
    const currentPlan = generatedPlans[currentPlanIndex];
    if (!currentPlan) return;

    // Navigate to customization page with floor plan data
    // Pass through isCreatingTemplate flag if we're in template creation mode
    // Build setbacks from compliance rules if available
    const cr = location.state?.complianceRules;
    const setbacks = cr ? {
      front: parseFloat(cr.front_setback) || 0,
      rear:  parseFloat(cr.rear_setback)  || 0,
      left:  parseFloat(cr.side_setback_left)  || 0,
      right: parseFloat(cr.side_setback_right) || 0
    } : null;

    navigate('/floor-plan/customize', {
      state: {
        floorPlan: currentPlan,
        allPlans: generatedPlans,         // pass all plans so customization can return them
        currentPlanIndex: currentPlanIndex, // pass index so we restore the right slot
        returnPath: '/floor-plan/generate',
        isCreatingTemplate: isCreatingTemplate,
        setbacks
      }
    });
  };

  // Generate completely new floor plans (not variations of existing)
  const generateVariations = async () => {
    // Simply trigger a fresh generation with current form data using GA
    // This ensures we always get 5 brand new diverse plans
    console.log('🔄 Generating fresh floor plans with GA...');
    
    const selectedRooms = getSelectedRooms();
    if (selectedRooms.length === 0) {
      alert('Please configure rooms first before generating variations');
      return;
    }
    
    await generateFloorPlans(false); // false = use GA (Genetic Algorithm)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selectedRooms = getSelectedRooms();
    const totalArea = getTotalAreaPercentage();
    
    if (selectedRooms.length === 0) {
      alert('Please select at least one room');
      return;
    }
    
    if (totalArea > 100) {
      alert(`Total area percentage (${totalArea.toFixed(1)}%) exceeds 100%. Please adjust room areas.`);
      return;
    }

    // Call the generation logic with useGenAI = false (GA)
    await generateFloorPlans(false);
  };

  const handleGenAISubmit = async (e) => {
    e.preventDefault();
    
    const selectedRooms = getSelectedRooms();
    const totalArea = getTotalAreaPercentage();
    
    if (selectedRooms.length === 0) {
      alert('Please select at least one room');
      return;
    }
    
    if (totalArea > 100) {
      alert(`Total area percentage (${totalArea.toFixed(1)}%) exceeds 100%. Please adjust room areas.`);
      return;
    }

    // Call the generation logic with useGenAI = true (Gemini)
    await generateFloorPlans(true);
  };

  // Download floorplan as PDF in black and white format
  const downloadPDF = useCallback(() => {
    if (generatedPlans.length === 0 || !generatedPlans[currentPlanIndex]) {
      alert('No floorplan to download');
      return;
    }

    try {
      const floorPlanData = generatedPlans[currentPlanIndex];
      
      // Create canvas for architectural drawing
      const canvasWidth = 1200;
      const canvasHeight = 1200;
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      
      // Fill white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Calculate scaling - use 1000x1000 coordinate system (floor plan data uses this)
      const margin = 80;
      const plotWidth = 1000;
      const plotHeight = 1000;
      const scaleX = (canvasWidth - 2 * margin) / plotWidth;
      const scaleY = (canvasHeight - 2 * margin) / plotHeight;
      const scale = Math.min(scaleX, scaleY);
      
      // Helper function to scale coordinates
      const sx = (x) => x * scale + margin;
      const sy = (y) => y * scale + margin;
      
      // Helper function to draw thick wall as filled rectangle
      const drawWallRect = (x1, y1, x2, y2, thickness) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(angle);
        ctx.fillStyle = '#808080'; // Grey fill
        ctx.fillRect(0, -thickness / 2, length, thickness);
        ctx.strokeStyle = '#000000'; // Black border
        ctx.lineWidth = 0.5;
        ctx.strokeRect(0, -thickness / 2, length, thickness);
        ctx.restore();
      };
      
      const outerWallThickness = 12;
      const innerWallThickness = 6;
      
      // Draw outer boundary (thicker rectangle walls)
      const bx = sx(0);
      const by = sy(0);
      const bw = plotWidth * scale;
      const bh = plotHeight * scale;
      
      // Draw grey diagonal hatching for empty space (before rooms and walls)
      if (floorPlanData.rooms && Array.isArray(floorPlanData.rooms) && floorPlanData.rooms.length === 0) {
        // If no rooms, fill entire plot with diagonal hatching
        ctx.save();
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        const spacing = 10; // Space between diagonal lines
        
        for (let i = -bh; i < bw + bh; i += spacing) {
          ctx.beginPath();
          ctx.moveTo(bx + i, by);
          ctx.lineTo(bx + i - bh, by + bh);
          ctx.stroke();
        }
        ctx.restore();
      } else if (floorPlanData.rooms && Array.isArray(floorPlanData.rooms)) {
        // Draw hatching in areas not covered by rooms
        ctx.save();
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 0.5;
        const spacing = 10;
        
        // Create a function to check if a point is inside any room
        const isInsideAnyRoom = (x, y) => {
          return floorPlanData.rooms.some(room => {
            const rx = sx(room.x || 0);
            const ry = sy(room.y || 0);
            const rw = (room.width || 0) * scale;
            const rh = (room.height || 0) * scale;
            return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
          });
        };
        
        // Draw diagonal lines across the plot
        for (let i = -bh; i < bw + bh; i += spacing) {
          ctx.beginPath();
          let isDrawing = false;
          
          for (let j = 0; j <= bh; j++) {
            const px = bx + i - j;
            const py = by + j;
            
            if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
              const inRoom = isInsideAnyRoom(px, py);
              
              if (!inRoom && !isDrawing) {
                ctx.moveTo(px, py);
                isDrawing = true;
              } else if (!inRoom && isDrawing) {
                ctx.lineTo(px, py);
              } else if (inRoom && isDrawing) {
                isDrawing = false;
              }
            }
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      
      // Top wall
      drawWallRect(bx, by, bx + bw, by, outerWallThickness);
      // Right wall
      drawWallRect(bx + bw, by, bx + bw, by + bh, outerWallThickness);
      // Bottom wall
      drawWallRect(bx + bw, by + bh, bx, by + bh, outerWallThickness);
      // Left wall
      drawWallRect(bx, by + bh, bx, by, outerWallThickness);
      
      // Draw rooms (walls as rectangles)
      if (floorPlanData.rooms && Array.isArray(floorPlanData.rooms)) {
        floorPlanData.rooms.forEach(room => {
          const x = sx(room.x || 0);
          const y = sy(room.y || 0);
          const w = (room.width || 0) * scale;
          const h = (room.height || 0) * scale;
          
          // Draw room walls as filled rectangles
          // Top wall
          drawWallRect(x, y, x + w, y, innerWallThickness);
          // Right wall
          drawWallRect(x + w, y, x + w, y + h, innerWallThickness);
          // Bottom wall
          drawWallRect(x + w, y + h, x, y + h, innerWallThickness);
          // Left wall
          drawWallRect(x, y + h, x, y, innerWallThickness);
          
          // Draw room label
          ctx.fillStyle = '#000000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const label = room.name || room.type || 'Room';
          const dimensions = `${Math.round(room.width)}' x ${Math.round(room.height)}'`;
          ctx.fillText(label, x + w / 2, y + h / 2 - 8);
          ctx.font = '10px Arial';
          ctx.fillText(dimensions, x + w / 2, y + h / 2 + 8);
        });
      }
      
      // Draw walls (internal) as rectangles
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData)) {
        const walls = floorPlanData.mapData.filter(item => item.type === 'Wall');
        
        walls.forEach(wall => {
          drawWallRect(sx(wall.x1 || 0), sy(wall.y1 || 0), sx(wall.x2 || 0), sy(wall.y2 || 0), innerWallThickness);
        });
      }
      
      // Draw doors (as arcs - architectural style, NO hinge line for clean wall when deleted)
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData)) {
        const doors = floorPlanData.mapData.filter(item => item.type === 'Door');
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        doors.forEach(door => {
          const x1 = sx(door.x1 || 0);
          const y1 = sy(door.y1 || 0);
          const x2 = sx(door.x2 || 0);
          const y2 = sy(door.y2 || 0);
          
          // Calculate door swing arc
          const dx = x2 - x1;
          const dy = y2 - y1;
          const doorLength = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          // Draw arc swing (90 degrees from hinge)
          ctx.beginPath();
          ctx.arc(x1, y1, doorLength, angle, angle + Math.PI / 2, false);
          ctx.stroke();
          
          // Draw door panel line
          ctx.beginPath();
          const endX = x1 + doorLength * Math.cos(angle + Math.PI / 2);
          const endY = y1 + doorLength * Math.sin(angle + Math.PI / 2);
          ctx.moveTo(x1, y1);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          
          // Draw small hinge circle only (not connection circles at both ends)
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(x1, y1, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // Draw windows (as rectangles with white fill)
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData)) {
        const windows = floorPlanData.mapData.filter(item => item.type === 'Window');
        
        windows.forEach(window => {
          const wx1 = sx(window.x1 || 0);
          const wy1 = sy(window.y1 || 0);
          const wx2 = sx(window.x2 || 0);
          const wy2 = sy(window.y2 || 0);
          
          // Calculate window rectangle
          const dx = wx2 - wx1;
          const dy = wy2 - wy1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const windowThickness = 4;
          
          ctx.save();
          ctx.translate(wx1, wy1);
          ctx.rotate(angle);
          
          // Fill white
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, -windowThickness / 2, length, windowThickness);
          
          // Black border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(0, -windowThickness / 2, length, windowThickness);
          
          ctx.restore();
          
          // Draw connection circles at window endpoints
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(wx1, wy1, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(wx2, wy2, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      // Convert to grayscale (ensure pure black and white)
      const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvasWidth / 2, canvasHeight / 2]
      });
      
      // Add the architectural drawing to PDF
      const pdfImageData = canvas.toDataURL('image/png');
      pdf.addImage(pdfImageData, 'PNG', 0, 0, canvasWidth / 2, canvasHeight / 2);
      
      // Download the PDF
      const fileName = `floorplan_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }, [generatedPlans, currentPlanIndex]);

  const generateFloorPlans = async (useGenAIFlag) => {
    const selectedRooms = getSelectedRooms();

    setIsGenerating(true);
    setGeneratingEngine(useGenAIFlag ? 'genai' : 'ga'); // Track which engine is being used
    setCurrentStep(2);

    try {
      // Create room tags from configuration
      const roomTags = selectedRooms;

      // Use user-defined connections or create simple chain connections
      let connects = [];
      
      // Always create base chain connections between all rooms so every room is connected
      for (let i = 0; i < roomTags.length - 1; i++) {
        connects.push({
          from_tag: roomTags[i],
          to_tag: roomTags[i + 1]
        });
      }

      // Add living room as a central hub if it exists
      const livingRoomIndex = roomTags.findIndex(tag => tag.startsWith('livingroom'));
      if (livingRoomIndex !== -1 && roomTags.length > 2) {
        // Connect living room to other major rooms
        roomTags.forEach((tag, index) => {
          if (index !== livingRoomIndex && (tag.startsWith('kitchen') || tag.startsWith('drawingroom'))) {
            connects.push({
              from_tag: roomTags[livingRoomIndex],
              to_tag: tag
            });
          }
        });
      }
      
      // Add compliance/user-defined connections on top of the base chain
      // (these are additional required connections, e.g. BEDROOM 1 → BATHROOM 1)
      if (formData.roomConnections.length > 0) {
        const complianceConnects = formData.roomConnections
          .filter(conn => conn.from && conn.to && conn.from !== conn.to)
          .map(conn => ({
            from_tag: conn.from,
            to_tag: conn.to
          }));
        
        // Merge: add compliance connections that don't already exist
        complianceConnects.forEach(cc => {
          const alreadyExists = connects.some(
            c => (c.from_tag === cc.from_tag && c.to_tag === cc.to_tag) ||
                 (c.from_tag === cc.to_tag && c.to_tag === cc.from_tag)
          );
          if (!alreadyExists) {
            connects.push(cc);
          }
        });
      }

      // Parse user-input plot dimensions (for display purposes)
      const currentDimensions = isCustomPlot ? customDimensions : plotDimensions;
      const actualPlotLength = parseFloat(currentDimensions.length) || 55;
      const actualPlotWidth = parseFloat(currentDimensions.width) || 25;
      
      // Use 1000x1000 coordinate system for backend generation (GA algorithm expects larger values)
      const width = 1000;
      const height = 1000;

      // Calculate area percentages for each individual room
      const roomAreaMap = {};
      const roomCounts = {};
      
      Object.entries(formData.roomConfiguration).forEach(([roomType, config]) => {
        if (config.count > 0) {
          roomCounts[roomType] = config.count;
          
          if (config.individualAreas && config.individualAreas.length === config.count) {
            // Use individual areas if available
            config.individualAreas.forEach((area, index) => {
              const roomTag = `${roomType}-${index + 1}`;
              roomAreaMap[roomTag] = area;
            });
          } else {
            // Fallback to equal division
            const areaPerRoom = config.areaPercentage / config.count;
            for (let i = 0; i < config.count; i++) {
              const roomTag = `${roomType}-${i + 1}`;
              roomAreaMap[roomTag] = areaPerRoom;
            }
          }
        }
      });

      // Calculate average areas for backend compatibility
      const averageAreas = {};
      Object.entries(formData.roomConfiguration).forEach(([roomType, config]) => {
        if (config.count > 0) {
          if (config.individualAreas && config.individualAreas.length === config.count) {
            averageAreas[roomType] = config.individualAreas.reduce((sum, area) => sum + area, 0) / config.count;
          } else {
            averageAreas[roomType] = config.areaPercentage / config.count;
          }
        }
      });

      // Build setback data from compliance rules if available
      const complianceRules = location.state?.complianceRules;
      const setbacks = complianceRules ? {
        front: parseFloat(complianceRules.front_setback) || 0,
        rear: parseFloat(complianceRules.rear_setback) || 0,
        left: parseFloat(complianceRules.side_setback_left) || 0,
        right: parseFloat(complianceRules.side_setback_right) || 0
      } : null;

      const backendData = {
        width,
        height,
        connects,
        kitchen_p: 0.7,
        living_p: 0.8,
        drawing_p: 0.8,
        car_p: 0.6,
        bath_p: 0.8,
        bed_p: 0.7,
        gar_p: 0.5,
        kitchen_per: averageAreas.kitchen || 15,
        living_per: averageAreas.livingroom || 25,
        drawing_per: averageAreas.drawingroom || 20,
        car_per: averageAreas.carporch || 10,
        bath_per: averageAreas.bathroom || 8,
        bed_per: averageAreas.bedroom || 20,
        gar_per: averageAreas.garden || 2,
        room_areas: roomAreaMap, // Send individual room areas
        use_genai: useGenAIFlag, // Send GenAI toggle flag
        num_plans: 5, // Request 5 floor plan variations
        // Genetic Algorithm Parameters
        population_size: gaParams.populationSize,
        mutation_rate: gaParams.mutationRate,
        crossover_rate: gaParams.crossoverRate,
        // Compliance setbacks and actual dimensions (for proper scaling)
        ...(setbacks && { setbacks }),
        ...(complianceRules && {
          actual_plot_width: parseFloat(complianceRules.plot_dimension_x) || actualPlotLength,
          actual_plot_height: parseFloat(complianceRules.plot_dimension_y) || actualPlotWidth,
          max_ground_coverage: parseFloat(complianceRules.max_ground_coverage) || 100
        })
      };

      console.log('Room configuration:', formData.roomConfiguration);
      console.log('Selected rooms:', selectedRooms);
      console.log('Room tags:', roomTags);
      console.log('Connections:', connects);
      console.log('Sending data to backend:', backendData);

      const response = await fetch('http://localhost:5000/api/floorplan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      });

      // Guard JSON parsing if server returns invalid JSON
      let result = null;
      try {
        result = await response.json();
      } catch (jsonErr) {
        console.error('Failed to parse JSON from backend:', jsonErr);
        throw new Error('Invalid JSON response from server');
      }

      console.log('Backend response:', result);

      if (response.ok && result && (result.success || result.floor_plans || result.data)) {
        // Attempt to find plans from common server fields
        const maps = result.floor_plans || result.data?.maps || result.maps || [];
        const roomData = result.room_data || result.data?.room || result.room || [];
        
        console.log('Maps received:', maps);
        console.log('Room data received:', roomData);
        
        // Debug each map to see what data it contains
        maps.forEach((map, idx) => {
          console.log(`Map ${idx}:`, map);
          if (Array.isArray(map)) {
            const doors = map.filter(item => item.type === 'Door');
            const walls = map.filter(item => item.type === 'Wall');
            console.log(`Map ${idx} - Doors: ${doors.length}, Walls: ${walls.length}`);
            console.log(`Map ${idx} - Door data:`, doors);
          }
        });
        
        const transformedPlans = (maps || []).map((plan, idx) => {
          // Get corresponding room data for this plan
          const rooms = roomData[idx] || [];
          
          // Transform room coordinate arrays to room objects
          const transformedRooms = rooms.map((room, roomIndex) => {
            if (Array.isArray(room) && room.length >= 5) {
              // Room format: [[x1,y1], [x2,y2], [x3,y3], [x4,y4], "roomtype-1"]
              const [p1, p2, p3, p4, roomTag] = room;
              const x = Math.min(p1[0], p2[0], p3[0], p4[0]);
              const y = Math.min(p1[1], p2[1], p3[1], p4[1]);
              const width = Math.max(p1[0], p2[0], p3[0], p4[0]) - x;
              const height = Math.max(p1[1], p2[1], p3[1], p4[1]) - y;
              
              return {
                id: roomIndex,
                x: x,
                y: y,
                width: width,
                height: height,
                type: roomTag || `Room ${roomIndex + 1}`,
                tag: roomTag
              };
            }
            return room; // Return as-is if already in correct format
          });
          
          return {
            id: idx + 1,
            fitness: Math.random() * 100, // Placeholder fitness score
            rooms: transformedRooms,
            mapData: plan, // Store original map data for visualization
            plotWidth: 1000,  // Coordinate system for rendering
            plotHeight: 1000, // Coordinate system for rendering
            actualLength: actualPlotLength,  // User's length input (vertical dimension)
            actualWidth: actualPlotWidth     // User's width input (horizontal dimension)
          };
        });

        console.log('Transformed plans:', transformedPlans);
        setGeneratedPlans(transformedPlans);
        setCurrentPlanIndex(0); // Reset to first plan
        setCurrentStep(3);
      } else {
        console.error('Backend error:', result?.error || result);
        alert(`Error generating floor plan: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating floor plans:', error);
      alert(`Failed to generate floor plan: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setGeneratingEngine(null); // Reset engine state
    }
  };

  const StepIndicator = ({ step, currentStep, title }) => {
    const base = 'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all';
    const stateClass = step === currentStep
      ? 'bg-[#ED7600] text-white'
      : step < currentStep
        ? 'bg-green-100 text-green-700'
        : 'bg-white/10 text-gray-300';

    const badgeClass = step === currentStep
      ? 'bg-white text-[#ED7600]'
      : step < currentStep
        ? 'bg-green-600 text-white'
        : 'bg-gray-500 text-white';

    return (
      <div className={`${base} ${stateClass}`}>
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${badgeClass}`}>
          {step}
        </span>
        <span>{title}</span>
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#2F3D57] overflow-hidden flex flex-col">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] border-b border-[#ED7600] flex-shrink-0">
        <div className="max-w-full mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#ED7600] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AI Floor Plan Generator</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-200">
              <StepIndicator step={1} currentStep={currentStep} title="Configure" />
              <div className="w-6 h-px bg-[#ED7600]" />
              <StepIndicator step={2} currentStep={currentStep} title="Generate" />
              <div className="w-6 h-px bg-[#ED7600]" />
              <StepIndicator step={3} currentStep={currentStep} title="Review" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-3 py-2 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 h-full">
          
          {/* Left Panel - Compact Configuration */}
          <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
            <div className="bg-white rounded-lg shadow-lg border-2 border-[#ED7600] overflow-hidden flex flex-col h-full">
              
              {/* Tab Navigation - Acts as header */}
              <div className="flex border-b border-gray-200 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] flex-shrink-0">
                {[
                  { id: 'plot', label: 'Plot', icon: '📐' },
                  { id: 'rooms', label: 'Rooms', icon: '🏠' },
                  { id: 'connections', label: 'Links', icon: '🔗' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-2 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
                      activeTab === tab.id
                        ? 'bg-white text-[#ED7600] rounded-t-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Plot Tab Content */}
                  {activeTab === 'plot' && (
                    <div className="space-y-4">
                      {/* Compliance Badge */}
                      {location.state?.fromPlotDetail && location.state?.complianceRules && (
                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>
                            <span className="font-medium text-green-800 text-sm">Compliance Applied</span>
                          </div>
                          <p className="text-xs text-green-700 mb-2">
                            {location.state.complianceRules.plot_dimension_x}×{location.state.complianceRules.plot_dimension_y} ft • {location.state.complianceRules.max_ground_coverage}% coverage
                          </p>
                          {/* Setback Details */}
                          {(location.state.complianceRules.front_setback > 0 || location.state.complianceRules.rear_setback > 0 || location.state.complianceRules.side_setback_left > 0 || location.state.complianceRules.side_setback_right > 0) && (
                            <div className="grid grid-cols-4 gap-1.5 mt-1">
                              <div className="bg-white/80 border border-green-200 rounded px-1.5 py-1 text-center">
                                <p className="text-[10px] text-green-600 font-medium">Front</p>
                                <p className="text-xs font-bold text-green-800">{location.state.complianceRules.front_setback}′</p>
                              </div>
                              <div className="bg-white/80 border border-green-200 rounded px-1.5 py-1 text-center">
                                <p className="text-[10px] text-green-600 font-medium">Rear</p>
                                <p className="text-xs font-bold text-green-800">{location.state.complianceRules.rear_setback}′</p>
                              </div>
                              <div className="bg-white/80 border border-green-200 rounded px-1.5 py-1 text-center">
                                <p className="text-[10px] text-green-600 font-medium">Left</p>
                                <p className="text-xs font-bold text-green-800">{location.state.complianceRules.side_setback_left}′</p>
                              </div>
                              <div className="bg-white/80 border border-green-200 rounded px-1.5 py-1 text-center">
                                <p className="text-[10px] text-green-600 font-medium">Right</p>
                                <p className="text-xs font-bold text-green-800">{location.state.complianceRules.side_setback_right}′</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Plot Size Selector */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#2F3D57]">Plot Size</label>
                        {loadingCompliances ? (
                          <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center gap-2 text-sm">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Loading...
                          </div>
                        ) : (
                          <select
                            value={isCustomPlot ? 'custom' : selectedPlotSize}
                            onChange={(e) => handlePlotSizeChange(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED7600]/20 focus:border-[#ED7600] transition-all text-sm bg-white"
                          >
                            {Object.entries(plotSizes).map(([marla, info]) => (
                              <option key={marla} value={marla}>
                                {info.label || `${marla} Marla`} ({info.sqFt.toLocaleString()} sq ft)
                              </option>
                            ))}
                            <option value="custom">Custom Plot Size (Min 3 Marla)</option>
                          </select>
                        )}
                      </div>

                      {/* Plot Visualization - Compact */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-center">
                          <svg width="160" height="100" viewBox="0 0 160 100" className="border border-gray-300 rounded bg-white">
                            <rect x="15" y="15" width="130" height="70" fill="#f0f9ff" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,4"/>
                            <text x="80" y="45" textAnchor="middle" fontSize="11" fill="#1f2937" fontWeight="bold">
                              {isCustomPlot ? 'Custom' : `${selectedPlotSize} Marla`}
                            </text>
                            <text x="80" y="60" textAnchor="middle" fontSize="9" fill="#6b7280">
                              {isCustomPlot ? `${customDimensions.length}ft × ${customDimensions.width}ft` : `${plotDimensions.length}ft × ${plotDimensions.width}ft`}
                            </text>
                          </svg>
                        </div>
                      </div>

                      {/* Dimension Inputs - Compact Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Length - X Axis (ft)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            value={isCustomPlot ? customDimensions.length : plotDimensions.length}
                            onChange={(e) => handleDimensionChange('length', e.target.value)}
                            className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ED7600] text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Width - Y Axis (ft)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            value={isCustomPlot ? customDimensions.width : plotDimensions.width}
                            onChange={(e) => handleDimensionChange('width', e.target.value)}
                            className="w-full px-2.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ED7600] text-sm"
                          />
                        </div>
                      </div>

                      {/* Quick Dimension Buttons */}
                      <div className="bg-[#ED7600]/5 p-2.5 rounded-lg border border-[#ED7600]/20">
                        <p className="text-xs text-gray-600 mb-2">Quick dimensions:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {plotSizes[selectedPlotSize]?.commonDimensions?.slice(0, 4).map((dim, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setPlotDimensions(dim)}
                              className="text-xs bg-white border border-[#ED7600]/30 px-2 py-1 rounded hover:bg-[#ED7600]/10 transition-colors"
                            >
                              {dim.length}×{dim.width}
                            </button>
                          ))}
                        </div>
                      </div>

                      {dimensionError && (
                        <div className={`p-2 rounded-lg text-xs ${
                          dimensionError.includes('Adjusted') 
                            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          {dimensionError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rooms Tab Content */}
                  {activeTab === 'rooms' && (
                    <div className="space-y-3">
                      {/* Area Distribution Mode */}
                      <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg">
                        <span className="text-xs font-medium text-gray-700">Distribution Mode</span>
                        <select
                          value={areaDistributionMode}
                          onChange={(e) => setAreaDistributionMode(e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#ED7600]"
                        >
                          <option value="auto">Auto-Rebalance</option>
                          <option value="manual">Manual</option>
                        </select>
                      </div>
                      
                      {/* Compact Room Cards Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {roomTypes.map((roomType) => (
                          <div key={roomType.key} className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-[#ED7600]/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-800 truncate">{roomType.label}</span>
                              <span className="text-[10px] text-gray-500">
                                {((formData.roomConfiguration[roomType.key]?.areaPercentage || 0)).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateRoomConfiguration(roomType.key, 'count', Math.max(0, (formData.roomConfiguration[roomType.key]?.count || 0) - 1))}
                                className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-sm"
                              >
                                −
                              </button>
                              <span className="text-sm font-semibold text-[#2F3D57] min-w-[20px] text-center">
                                {formData.roomConfiguration[roomType.key]?.count || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateRoomConfiguration(roomType.key, 'count', (formData.roomConfiguration[roomType.key]?.count || 0) + 1)}
                                className="w-6 h-6 rounded bg-[#ED7600] hover:bg-[#D56900] text-white flex items-center justify-center text-sm"
                              >
                                +
                              </button>
                            </div>
                            
                            {/* Area Slider - Only show if count > 0 */}
                            {(formData.roomConfiguration[roomType.key]?.count || 0) > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <input
                                  type="range"
                                  min="0"
                                  max="50"
                                  step="1"
                                  value={formData.roomConfiguration[roomType.key]?.areaPercentage || 0}
                                  onChange={(e) => updateRoomConfiguration(roomType.key, 'areaPercentage', e.target.value)}
                                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ED7600]"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Individual Room Areas (Collapsed by default) */}
                      {getSelectedRooms().length > 0 && (
                        <details className="bg-gray-50 rounded-lg border border-gray-200">
                          <summary className="px-3 py-2 cursor-pointer text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                            Fine-tune individual areas ({getSelectedRooms().length} rooms)
                          </summary>
                          <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                            {roomTypes.filter(rt => (formData.roomConfiguration[rt.key]?.count || 0) > 0).map((roomType) => (
                              <div key={roomType.key} className="space-y-1">
                                {Array.from({ length: formData.roomConfiguration[roomType.key].count }, (_, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 w-16 truncate">{roomType.label} {index + 1}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.5"
                                      value={formData.roomConfiguration[roomType.key]?.individualAreas?.[index] || roomType.defaultArea}
                                      onChange={(e) => updateIndividualRoomArea(roomType.key, index, e.target.value)}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#ED7600]"
                                    />
                                    <span className="text-[10px] text-gray-400">%</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                  {/* Connections Tab Content */}
                  {activeTab === 'connections' && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600">Define which rooms should be adjacent to each other.</p>
                      
                      {/* Connection List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {formData.roomConnections.map((connection, index) => (
                          <div key={index} className="bg-white rounded-lg p-2 border border-gray-200 flex items-center gap-2">
                            <select
                              value={connection.from}
                              onChange={(e) => updateRoomConnection(index, 'from', e.target.value)}
                              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#ED7600]"
                            >
                              <option value="">From...</option>
                              {getSelectedRooms().map(roomTag => (
                                <option key={roomTag} value={roomTag}>
                                  {roomTag.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                              ))}
                            </select>
                            <span className="text-gray-400 text-xs">↔</span>
                            <select
                              value={connection.to}
                              onChange={(e) => updateRoomConnection(index, 'to', e.target.value)}
                              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#ED7600]"
                            >
                              <option value="">To...</option>
                              {getSelectedRooms().map(roomTag => (
                                <option key={roomTag} value={roomTag}>
                                  {roomTag.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeRoomConnection(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addRoomConnection}
                        disabled={getSelectedRooms().length < 2}
                        className="w-full bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Connection
                      </button>

                      {getSelectedRooms().length < 2 && (
                        <p className="text-amber-600 text-xs text-center">Add at least 2 rooms first</p>
                      )}
                    </div>
                  )}
                </form>
              </div>

              {/* Fixed Bottom: Area Status + Generate Buttons */}
              <div className="border-t border-gray-200 bg-gray-50 p-2 space-y-2 flex-shrink-0">
                {/* Area Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Area Used</span>
                    <span className={`font-semibold ${
                      Math.abs(totalAreaPercentage - 100) < 0.1 ? 'text-green-600' : 
                      totalAreaPercentage > 100 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {totalAreaPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        Math.abs(totalAreaPercentage - 100) < 0.1 ? 'bg-green-500' : 
                        totalAreaPercentage > 100 ? 'bg-red-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min(totalAreaPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Compact Generate Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={(isGenerating && generatingEngine === 'ga') || getSelectedRooms().length === 0 || getTotalAreaPercentage() > 100}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    {isGenerating && generatingEngine === 'ga' ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>🧬 GA Generate</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenAISubmit}
                    disabled={(isGenerating && generatingEngine === 'genai') || getSelectedRooms().length === 0 || getTotalAreaPercentage() > 100}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    {isGenerating && generatingEngine === 'genai' ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>✨ AI Generate</span>
                    )}
                  </button>
                </div>

                {/* Validation Error */}
                {(getSelectedRooms().length === 0 || getTotalAreaPercentage() > 100) && (
                  <p className="text-[10px] text-red-600 text-center">
                    {getSelectedRooms().length === 0 ? 'Add rooms to generate' : 'Area exceeds 100%'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Visualization + Controls */}
          <div className="col-span-12 lg:col-span-8 flex flex-col h-full gap-2 min-h-0">
            
            {/* Floor Plan Visualization */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-[#ED7600] overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-semibold text-white">Floor Plan Preview</h2>
                  {generatedPlans.length > 0 && (
                    <span className="text-xs text-gray-300">• {currentPlanIndex + 1}/{generatedPlans.length}</span>
                  )}
                </div>
                
                {/* Navigation + Actions */}
                {generatedPlans.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevPlan}
                      disabled={generatedPlans.length <= 1}
                      className="p-1.5 rounded border border-white/30 text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextPlan}
                      disabled={generatedPlans.length <= 1}
                      className="p-1.5 rounded border border-white/30 text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="w-px h-5 bg-white/30 mx-1"></div>
                    <button
                      onClick={downloadPDF}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </button>
                    <button
                      onClick={navigateToCustomization}
                      className="px-3 py-1.5 bg-[#ED7600] hover:bg-[#D56900] text-white text-xs font-medium rounded flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Customize
                    </button>
                    <button
                      onClick={generateVariations}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white text-xs font-medium rounded flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Variations
                    </button>
                  </div>
                )}
              </div>

              {/* Visualization Area */}
              <div className="flex-1 p-2 overflow-hidden min-h-0">
                {generatedPlans.length > 0 ? (
                  <div className="h-full flex gap-2">
                    {/* Main Floor Plan - Takes most of the space */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div ref={canvasContainerRef} className="flex-1 bg-gray-50 rounded border border-gray-200 overflow-hidden min-h-0 flex items-center justify-center">
                        <KonvaFloorPlan
                          ref={stageRef}
                          floorPlanData={generatedPlans[currentPlanIndex]}
                          width={canvasSize.width}
                          height={canvasSize.height}
                          isEditable={false}
                          setbacks={(() => {
                            const cr = location.state?.complianceRules;
                            if (!cr) return null;
                            const front = parseFloat(cr.front_setback);
                            const rear  = parseFloat(cr.rear_setback);
                            const left  = parseFloat(cr.side_setback_left);
                            const right = parseFloat(cr.side_setback_right);
                            if (!front && !rear && !left && !right) return null;
                            return { front: front || 0, rear: rear || 0, left: left || 0, right: right || 0 };
                          })()}
                          onPlanUpdate={(updatedPlan) => {
                            setGeneratedPlans(prev => {
                              const newPlans = [...prev];
                              newPlans[currentPlanIndex] = updatedPlan;
                              return newPlans;
                            });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                      
                      {/* Plan Stats - Inline */}
                      <div className="mt-1.5 flex gap-2 justify-center">
                        <div className="bg-gray-100 rounded px-2 py-1 text-center">
                          <span className="text-xs font-bold text-[#2F3D57]">{generatedPlans[currentPlanIndex]?.rooms?.length || 0}</span>
                          <span className="text-[9px] text-gray-500 ml-1">rooms</span>
                        </div>
                        <div className="bg-gray-100 rounded px-2 py-1 text-center">
                          <span className="text-xs font-bold text-[#ED7600]">{(generatedPlans[currentPlanIndex]?.fitness * 100)?.toFixed(0) || 0}%</span>
                          <span className="text-[9px] text-gray-500 ml-1">fitness</span>
                        </div>
                        <div className="bg-gray-100 rounded px-2 py-1 text-center">
                          <span className="text-xs font-bold text-green-600">
                            {generatedPlans[currentPlanIndex]?.actualLength || (isCustomPlot ? customDimensions.length : plotDimensions.length)}×{generatedPlans[currentPlanIndex]?.actualWidth || (isCustomPlot ? customDimensions.width : plotDimensions.width)}
                          </span>
                          <span className="text-[9px] text-gray-500 ml-1">ft</span>
                        </div>
                      </div>
                    </div>

                    {/* Variations Panel - Narrower */}
                    <div className="w-24 flex flex-col gap-1 overflow-y-auto flex-shrink-0">
                      <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wide text-center">Variations</p>
                      {generatedPlans.slice(0, 5).map((plan, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPlanIndex(index)}
                          className={`relative rounded border-2 p-1 transition-all ${
                            currentPlanIndex === index
                              ? 'border-[#ED7600] bg-[#ED7600]/5 shadow-sm'
                              : 'border-gray-200 hover:border-[#ED7600]/50 bg-white'
                          }`}
                        >
                          {/* Mini Preview */}
                          <div className="aspect-square bg-gray-50 rounded overflow-hidden relative">
                            {/* Simple room blocks visualization */}
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                              {plan.rooms?.slice(0, 6).map((room, rIdx) => (
                                <rect
                                  key={rIdx}
                                  x={(room.x / (plan.plotWidth || 1000)) * 100}
                                  y={(room.y / (plan.plotHeight || 1000)) * 100}
                                  width={(room.width / (plan.plotWidth || 1000)) * 100}
                                  height={(room.height / (plan.plotHeight || 1000)) * 100}
                                  fill={getRoomColor(room.type || room.tag)}
                                  stroke="#374151"
                                  strokeWidth="0.5"
                                />
                              ))}
                            </svg>
                            {/* Variation Number Badge */}
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${
                              currentPlanIndex === index ? 'bg-[#ED7600] text-white' : 'bg-gray-300 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                          {/* Fitness Score */}
                          <p className={`text-[9px] text-center mt-0.5 font-medium ${
                            currentPlanIndex === index ? 'text-[#ED7600]' : 'text-gray-500'
                          }`}>
                            {(plan.fitness * 100)?.toFixed(0) || 0}% fit
                          </p>
                        </button>
                      ))}
                      {generatedPlans.length < 5 && (
                        <div className="flex-1 flex items-center justify-center text-gray-300 text-[9px] text-center p-2">
                          Generate more variations
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-sm font-medium">No floor plan generated yet</p>
                    <p className="text-xs mt-1">Configure rooms and click Generate</p>
                  </div>
                )}
              </div>
            </div>

            {/* GA Parameters - Collapsible (only show when plans exist) */}
            {generatedPlans.length > 0 && (
              <details className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex-shrink-0">
                <summary className="px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">⚙️ Advanced GA Parameters</span>
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="p-3 grid grid-cols-3 gap-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Population Size</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={gaParams.populationSize}
                      onChange={(e) => setGaParams({...gaParams, populationSize: parseInt(e.target.value) || 20})}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#ED7600]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mutation Rate: {(gaParams.mutationRate * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0.01"
                      max="0.5"
                      step="0.01"
                      value={gaParams.mutationRate}
                      onChange={(e) => setGaParams({...gaParams, mutationRate: parseFloat(e.target.value)})}
                      className="w-full accent-[#ED7600]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Crossover Rate: {(gaParams.crossoverRate * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={gaParams.crossoverRate}
                      onChange={(e) => setGaParams({...gaParams, crossoverRate: parseFloat(e.target.value)})}
                      className="w-full accent-[#ED7600]"
                    />
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanGenerator;
