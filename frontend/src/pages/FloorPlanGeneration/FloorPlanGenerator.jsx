import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import KonvaFloorPlan from '../../components/FloorPlan/KonvaFloorPlan';

const FloorPlanGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [totalAreaPercentage, setTotalAreaPercentage] = useState(0);
  const [availableAreaPercentage, setAvailableAreaPercentage] = useState(100);
  const [areaDistributionMode, setAreaDistributionMode] = useState('auto'); // 'auto' or 'manual'
  const [generatingEngine, setGeneratingEngine] = useState(null); // Track which engine is currently generating: 'ga' or 'genai'

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

  // Plot size configurations (1 marla = 272.25 sq ft = 25.29 sq meters)
  const plotSizes = {
    5: { marla: 5, sqFt: 1361.25, sqMeters: 126.45, commonDimensions: [
      { length: 25, width: 45 },
      { length: 30, width: 37.5 },
      { length: 22.5, width: 50 }
    ]},
    7: { marla: 7, sqFt: 1905.75, sqMeters: 177.03, commonDimensions: [
      { length: 35, width: 45 },
      { length: 30, width: 52.5 },
      { length: 37.5, width: 42 }
    ]},
    10: { marla: 10, sqFt: 2722.5, sqMeters: 252.9, commonDimensions: [
      { length: 45, width: 50 },
      { length: 40, width: 56.25 },
      { length: 37.5, width: 60 }
    ]},
    20: { marla: 20, sqFt: 5445, sqMeters: 505.8, commonDimensions: [
      { length: 60, width: 75 },
      { length: 50, width: 90 },
      { length: 67.5, width: 66.7 }
    ]}
  };

  const [selectedPlotSize, setSelectedPlotSize] = useState(10);
  const [plotDimensions, setPlotDimensions] = useState({ length: 45, width: 50 });
  const [dimensionError, setDimensionError] = useState('');

  // Calculate opposite dimension based on area constraint
  const calculateOppositeDimension = (knownDimension, value, plotSize) => {
    const maxArea = plotSizes[plotSize].sqMeters;
    const oppositeDimension = maxArea / value;
    return Math.round(oppositeDimension * 10) / 10; // Round to 1 decimal place
  };

  // Handle dimension changes with area validation
  const handleDimensionChange = (dimension, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setDimensionError('Please enter a valid positive number');
      return;
    }

    const maxArea = plotSizes[selectedPlotSize].sqMeters;
    const currentArea = dimension === 'length' 
      ? numValue * plotDimensions.width 
      : plotDimensions.length * numValue;

    if (currentArea > maxArea) {
      // Auto-calculate the opposite dimension to fit within area limit
      const oppositeDim = dimension === 'length' ? 'width' : 'length';
      const calculatedValue = calculateOppositeDimension(dimension, numValue, selectedPlotSize);
      
      setPlotDimensions({
        ...plotDimensions,
        [dimension]: numValue,
        [oppositeDim]: calculatedValue
      });
      
      setDimensionError(`Adjusted ${oppositeDim} to ${calculatedValue}m to fit ${selectedPlotSize} marla limit`);
    } else {
      setPlotDimensions({
        ...plotDimensions,
        [dimension]: numValue
      });
      setDimensionError('');
    }
  };

  // Handle plot size change
  const handlePlotSizeChange = (marlaSize) => {
    setSelectedPlotSize(marlaSize);
    const defaultDimensions = plotSizes[marlaSize].commonDimensions[0];
    setPlotDimensions(defaultDimensions);
    setDimensionError('');
  };

  // Helper function to create a simplified floor plan preview
  const createFloorPlanPreview = (plan) => {
    if (!plan || !plan.rooms || plan.rooms.length === 0) {
      return null;
    }

    // Define room colors based on type
    const roomColors = {
      'livingroom': '#FFB3BA',
      'bedroom': '#BAFFC9',
      'kitchen': '#FFFFBA',
      'bathroom': '#BAE1FF',
      'drawingroom': '#FFDFBA',
      'carporch': '#E0BBE4',
      'garden': '#C7CEEA',
      'default': '#F0F0F0'
    };

    // Create a grid-based layout
    const gridSize = 100;
    const padding = 10;

    return (
      <svg width="130" height="110" viewBox="0 0 130 110" className="border border-gray-300 rounded">
        {/* Background */}
        <rect x="0" y="0" width="130" height="110" fill="#f8f9fa" stroke="#dee2e6" strokeWidth="1"/>
        
        {/* Render rooms based on their data */}
        {plan.rooms.map((room, index) => {
          // Calculate position and size based on room data or use grid layout
          const cols = Math.ceil(Math.sqrt(plan.rooms.length));
          const rows = Math.ceil(plan.rooms.length / cols);
          
          const roomWidth = (gridSize - padding * (cols + 1)) / cols;
          const roomHeight = (90 - padding * (rows + 1)) / rows;
          
          const col = index % cols;
          const row = Math.floor(index / cols);
          
          const x = padding + col * (roomWidth + padding);
          const y = padding + row * (roomHeight + padding);
          
          // Use actual room dimensions if available, otherwise use grid layout
          const finalX = room.x !== undefined ? (room.x / 10) + 5 : x;
          const finalY = room.y !== undefined ? (room.y / 10) + 5 : y;
          const finalWidth = room.width !== undefined ? Math.max(room.width / 10, 15) : roomWidth;
          const finalHeight = room.height !== undefined ? Math.max(room.height / 10, 15) : roomHeight;
          
          const roomType = room.type || 'default';
          const color = roomColors[roomType] || roomColors.default;
          
          return (
            <g key={index}>
              <rect
                x={finalX}
                y={finalY}
                width={finalWidth}
                height={finalHeight}
                fill={color}
                stroke="#666"
                strokeWidth="1"
                rx="2"
              />
              <text
                x={finalX + finalWidth / 2}
                y={finalY + finalHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill="#333"
                fontWeight="bold"
              >
                {roomType.charAt(0).toUpperCase()}
              </text>
            </g>
          );
        })}
        
        {/* Add doors if available */}
        {plan.doors && plan.doors.map((door, index) => (
          <line
            key={`door-${index}`}
            x1={(door.x1 / 10) + 5}
            y1={(door.y1 / 10) + 5}
            x2={(door.x2 / 10) + 5}
            y2={(door.y2 / 10) + 5}
            stroke="#8B4513"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
        
        {/* Add walls if available */}
        {plan.walls && plan.walls.map((wall, index) => (
          <line
            key={`wall-${index}`}
            x1={(wall.x1 / 10) + 5}
            y1={(wall.y1 / 10) + 5}
            x2={(wall.x2 / 10) + 5}
            y2={(wall.y2 / 10) + 5}
            stroke="#333"
            strokeWidth="2"
          />
        ))}
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
        plotDimensions: formData.plotDimensions
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
    navigate('/floor-plan/customize', {
      state: {
        floorPlan: currentPlan,
        returnPath: '/floor-plan/generate'
      }
    });
  };

  // Generate new variations based on current plan
  const generateVariations = async () => {
    const currentPlan = generatedPlans[currentPlanIndex];
    if (!currentPlan) return;

    setIsGenerating(true);

    try {
      const variationData = {
        basePlan: currentPlan,
        variationCount: 3,
        mutationRate: 0.1,
        crossoverRate: 0.7
      };

      const response = await fetch('http://localhost:5000/api/floorplan/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variationData)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.variations) {
          // Add new variations to the plans list
          const newVariations = result.variations.map((variation, idx) => ({
            ...variation,
            id: `${currentPlan.id}-var-${idx + 1}`,
            isVariation: true,
            parentId: currentPlan.id
          }));

          setGeneratedPlans(prevPlans => [...prevPlans, ...newVariations]);
          alert(`Generated ${newVariations.length} new variations!`);
        }
      }
    } catch (error) {
      console.error('Error generating variations:', error);
      alert('Failed to generate variations. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
      
      if (formData.roomConnections.length > 0) {
        // Use user-defined connections
        connects = formData.roomConnections
          .filter(conn => conn.from && conn.to && conn.from !== conn.to)
          .map(conn => ({
            from_tag: conn.from,
            to_tag: conn.to
          }));
      } else {
        // Fallback to simple chain connections between rooms
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
      }

      // Safely parse numeric inputs
      const parsedWidth = parseInt(formData.plotDimensions.width, 10);
      const parsedHeight = parseInt(formData.plotDimensions.height, 10);
      const width = Number.isNaN(parsedWidth) ? 1000 : parsedWidth;
      const height = Number.isNaN(parsedHeight) ? 1000 : parsedHeight;

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
        num_plans: 5 // Request 5 floor plan variations
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
            mapData: plan // Store original map data for visualization
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
    const base = 'flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300';
    const stateClass = step === currentStep
      ? 'bg-[#ED7600] text-white shadow-lg'
      : step < currentStep
        ? 'bg-green-100 text-green-700 border-2 border-green-300'
        : 'bg-white/20 text-gray-200 border-2 border-gray-400';

    const badgeClass = step === currentStep
      ? 'bg-white text-[#ED7600] shadow-md'
      : step < currentStep
        ? 'bg-green-600 text-white'
        : 'bg-gray-400 text-white';

    return (
      <div className={`${base} ${stateClass}`}>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${badgeClass} transition-all duration-300`}>
          {step}
        </span>
        <span className={`font-semibold ${step === currentStep ? 'text-white' : step < currentStep ? 'text-green-700' : 'text-gray-200'}`}>
          {title}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#2F3D57]">
      {/* Clean Header */}
      <div className="bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] border-b border-[#ED7600] shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#ED7600] rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Floor Plan Generator</h1>
                <p className="text-gray-200">Create optimized floor plans using genetic algorithms</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-200">
              <StepIndicator step={1} currentStep={currentStep} title="Configure" />
              <div className="w-8 h-px bg-[#ED7600]" />
              <StepIndicator step={2} currentStep={currentStep} title="Generate" />
              <div className="w-8 h-px bg-[#ED7600]" />
              <StepIndicator step={3} currentStep={currentStep} title="Review" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Basic Configuration */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border-4 border-[#ED7600] overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a]">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#ED7600] rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Basic Setup</h2>
                    <p className="text-sm text-gray-200">Plot dimensions & room types</p>
                  </div>
                </div>
              </div>

              {/* Left Forms Container */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Plot Dimensions */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => toggleSection('dimensions')}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] rounded-xl hover:from-[#1e2a3a] hover:to-[#2F3D57] transition-all duration-300 shadow-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#ED7600] text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">1</div>
                        <span className="font-semibold text-white">Plot Dimensions</span>
                      </div>
                      <svg className={`w-5 h-5 text-gray-200 transition-transform duration-200 ${collapsedSections.dimensions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {!collapsedSections.dimensions && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border-2 border-[#ED7600]/20">
                        <div>
                          <label className="block text-sm font-semibold text-[#2F3D57] mb-2">Width (units)</label>
                          <input
                            type="number"
                            value={formData.plotDimensions.width}
                            onChange={(e) => handleInputChange('plotDimensions', 'width', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED7600]/20 focus:border-[#ED7600] transition-all duration-200 bg-white"
                            placeholder="1000"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#2F3D57] mb-2">Height (units)</label>
                          <input
                            type="number"
                            value={formData.plotDimensions.height}
                            onChange={(e) => handleInputChange('plotDimensions', 'height', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED7600]/20 focus:border-[#ED7600] transition-all duration-200 bg-white"
                            placeholder="1000"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plot Size Configuration */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => toggleSection('plot-size')}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] rounded-xl hover:from-[#1e2a3a] hover:to-[#2F3D57] transition-all duration-300 shadow-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#ED7600] text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md">📐</div>
                        <span className="font-semibold text-white">Plot Size & Dimensions</span>
                      </div>
                      <svg className={`w-5 h-5 text-gray-200 transition-transform duration-200 ${collapsedSections['plot-size'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {!collapsedSections['plot-size'] && (
                      <div className="p-4 bg-gray-50 rounded-xl border-2 border-[#ED7600]/20 space-y-4">
                        <div className="text-sm text-[#2F3D57] mb-3 font-medium">
                          Select your plot size and configure dimensions. The system will automatically ensure your floor plan fits within the selected area.
                        </div>

                        {/* Plot Size Dropdown */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-[#2F3D57]">Plot Size</label>
                          <select
                            value={selectedPlotSize}
                            onChange={(e) => handlePlotSizeChange(parseInt(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED7600]/20 focus:border-[#ED7600] transition-all duration-200 bg-white"
                          >
                            {Object.entries(plotSizes).map(([marla, info]) => (
                              <option key={marla} value={marla}>
                                {marla} Marla ({info.sqFt.toLocaleString()} sq ft / {info.sqMeters.toFixed(1)} sq m)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Visual Plot Map */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Plot Visualization</h4>
                          <div className="flex justify-center">
                            <div className="relative">
                              {/* Plot Rectangle */}
                              <svg width="200" height="150" viewBox="0 0 200 150" className="border border-gray-300 rounded">
                                <rect
                                  x="20"
                                  y="20"
                                  width="160"
                                  height="110"
                                  fill="#f0f9ff"
                                  stroke="#3b82f6"
                                  strokeWidth="2"
                                  strokeDasharray="5,5"
                                />
                                <text x="100" y="80" textAnchor="middle" fontSize="12" fill="#1f2937" fontWeight="bold">
                                  {selectedPlotSize} Marla Plot
                                </text>
                                <text x="100" y="95" textAnchor="middle" fontSize="10" fill="#6b7280">
                                  {plotDimensions.length}m × {plotDimensions.width}m
                                </text>
                                <text x="100" y="108" textAnchor="middle" fontSize="10" fill="#6b7280">
                                  {(plotDimensions.length * plotDimensions.width).toFixed(1)} sq m
                                </text>
                                
                                {/* Dimension Labels */}
                                <text x="100" y="15" textAnchor="middle" fontSize="10" fill="#374151">
                                  {plotDimensions.length}m
                                </text>
                                <text x="12" y="78" textAnchor="middle" fontSize="10" fill="#374151" transform="rotate(-90, 12, 78)">
                                  {plotDimensions.width}m
                                </text>
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Dimension Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Length (meters)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              value={plotDimensions.length}
                              onChange={(e) => handleDimensionChange('length', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="Enter length"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Width (meters)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              value={plotDimensions.width}
                              onChange={(e) => handleDimensionChange('width', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              placeholder="Enter width"
                            />
                          </div>
                        </div>

                        {/* Error/Info Message */}
                        {dimensionError && (
                          <div className={`p-3 rounded-lg text-sm ${
                            dimensionError.includes('Adjusted') 
                              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                            {dimensionError}
                          </div>
                        )}

                        {/* Common Dimensions for Selected Plot */}
                        <div className="bg-[#ED7600]/10 p-3 rounded-lg border border-[#ED7600]/30">
                          <h5 className="text-sm font-medium text-blue-900 mb-2">
                            Common dimensions for {selectedPlotSize} Marla:
                          </h5>
                          <div className="grid grid-cols-3 gap-2">
                            {plotSizes[selectedPlotSize].commonDimensions.map((dim, index) => (
                              <button
                                key={index}
                                onClick={() => setPlotDimensions(dim)}
                                className="text-xs bg-white border border-[#ED7600]/40 px-2 py-1 rounded hover:bg-[#ED7600]/10 transition-colors"
                              >
                                {dim.length}×{dim.width}m
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Room Configuration */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => toggleSection('rooms')}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 bg-green-600 text-white rounded-md flex items-center justify-center text-sm font-medium">2</div>
                        <span className="font-medium text-gray-900">Room Configuration</span>
                      </div>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${collapsedSections.rooms ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {!collapsedSections.rooms && (
                      <div className="space-y-4">
                        {/* Area Distribution Status */}
                        <div className="bg-gradient-to-r from-[#ED7600]/10 to-[#2F3D57]/10 rounded-lg p-4 border border-[#ED7600]/30">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Area Distribution</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Mode:</span>
                              <select
                                value={areaDistributionMode}
                                onChange={(e) => setAreaDistributionMode(e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="auto">Auto-Rebalance</option>
                                <option value="manual">Manual Control</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Total Area Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Total Area Used</span>
                              <span className={`font-medium ${
                                Math.abs(totalAreaPercentage - 100) < 0.1 ? 'text-green-600' : 
                                totalAreaPercentage > 100 ? 'text-red-600' : 'text-orange-600'
                              }`}>
                                {totalAreaPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  Math.abs(totalAreaPercentage - 100) < 0.1 ? 'bg-green-500' : 
                                  totalAreaPercentage > 100 ? 'bg-red-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${Math.min(totalAreaPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Available Area Display */}
                          <div className="text-sm">
                            <span className="text-gray-600">Available for new rooms: </span>
                            <span className={`font-medium ${availableAreaPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {availableAreaPercentage.toFixed(1)}%
                            </span>
                          </div>
                          
                          {/* Warning Messages */}
                          {totalAreaPercentage > 100 && (
                            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                              ⚠️ Total area exceeds 100%. Consider reducing room sizes.
                            </div>
                          )}
                          
                          {areaDistributionMode === 'auto' && (
                            <div className="mt-2 text-xs text-[#2F3D57] bg-[#ED7600]/10 p-2 rounded border border-[#ED7600]/20">
                              🔄 Auto-rebalancing enabled. Changes will automatically adjust other rooms.
                            </div>
                          )}
                        </div>
                        
                        {/* Room Type Configurations */}
                        <div className="space-y-4">
                          {roomTypes.map((roomType) => (
                            <div key={roomType.key} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">{roomType.label}</h4>
                                <span className="text-xs text-gray-500">
                                  Total: {((formData.roomConfiguration[roomType.key]?.areaPercentage || 0)).toFixed(1)}%
                                </span>
                              </div>
                              
                              <div className="space-y-3">
                                {/* Number of Rooms Input */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rooms</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={formData.roomConfiguration[roomType.key]?.count || 0}
                                    onChange={(e) => updateRoomConfiguration(roomType.key, 'count', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                </div>
                                
                                {/* Total Area Percentage for Room Type */}
                                {formData.roomConfiguration[roomType.key]?.count > 0 && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Total Area for {roomType.label} (%)
                                    </label>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={formData.roomConfiguration[roomType.key]?.areaPercentage || 0}
                                        onChange={(e) => updateRoomConfiguration(roomType.key, 'areaPercentage', e.target.value)}
                                        className="flex-1"
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={formData.roomConfiguration[roomType.key]?.areaPercentage || 0}
                                        onChange={(e) => updateRoomConfiguration(roomType.key, 'areaPercentage', e.target.value)}
                                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-600">%</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Individual Room Area Inputs */}
                                {formData.roomConfiguration[roomType.key]?.count > 0 && (
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Individual Room Areas (%)</label>
                                  <div className="grid grid-cols-1 gap-2">
                                    {Array.from({ length: formData.roomConfiguration[roomType.key].count }, (_, index) => (
                                      <div key={index} className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600 w-16 flex-shrink-0">
                                          {roomType.label} {index + 1}:
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={formData.roomConfiguration[roomType.key]?.individualAreas?.[index] || roomType.defaultArea}
                                          onChange={(e) => updateIndividualRoomArea(roomType.key, index, e.target.value)}
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                          placeholder={roomType.defaultArea.toString()}
                                        />
                                        <span className="text-xs text-gray-500 w-8">%</span>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Room Type Summary */}
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                    <div className="flex justify-between">
                                      <span>Subtotal for {roomType.label}:</span>
                                      <span className="font-medium">
                                        {(formData.roomConfiguration[roomType.key]?.individualAreas?.reduce((sum, area) => sum + area, 0) || 0).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Total Area Summary */}
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">Total Area Coverage</span>
                            <span className={`text-sm font-bold ${getTotalAreaPercentage() > 100 ? 'text-red-600' : 'text-blue-900'}`}>
                              {getTotalAreaPercentage().toFixed(1)}%
                            </span>
                          </div>
                          {getTotalAreaPercentage() > 100 && (
                            <p className="text-xs text-red-600 mt-1">⚠️ Total exceeds 100%. Please adjust room areas.</p>
                          )}
                        </div>
                        </div>
                      </div>
                    )}
                  </div>

                </form>
              </div>
            </div>
          </div>

          {/* Center Panel - Visualization */}
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-white rounded-2xl shadow-xl border-4 border-[#ED7600] overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#ED7600] rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Floor Plan Visualization</h2>
                      <p className="text-sm text-gray-200">Real-time preview of generated plans</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 min-h-[32rem]">
                {generatedPlans.length > 0 ? (
                  <div className="space-y-6">
                    {/* Navigation Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Floor Plan Variation {currentPlanIndex + 1} of {generatedPlans.length}
                        </h3>
                        <span className="px-3 py-1 bg-[#ED7600]/20 text-[#2F3D57] rounded-full text-sm font-semibold border border-[#ED7600]/40">
                          Score: {(generatedPlans[currentPlanIndex]?.fitness ?? 0).toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Navigation and Control Buttons */}
                      <div className="flex items-center space-x-3">
                        {/* Customize Button */}
                        <button
                          onClick={navigateToCustomization}
                          className="px-6 py-3 rounded-xl border-2 transition-all duration-300 flex items-center space-x-2 bg-[#ED7600] text-white border-[#ED7600] hover:bg-[#D56900] hover:border-[#D56900] shadow-lg font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Customize Plan</span>
                        </button>


                        {/* Generate Variations */}
                        <button
                          onClick={generateVariations}
                          disabled={isGenerating}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Generate Variations</span>
                        </button>

                        <div className="w-px h-6 bg-gray-300"></div>

                        {/* Navigation Buttons */}
                        <button
                          onClick={prevPlan}
                          disabled={generatedPlans.length <= 1}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={nextPlan}
                          disabled={generatedPlans.length <= 1}
                          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Large Floor Plan Display with Konva Canvas */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="space-y-4">
                        {/* Status indicators */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Status indicators removed - customization moved to separate page */}
                          </div>

                          {/* Plan info */}
                          <div className="text-sm text-gray-600">
                            {generatedPlans[currentPlanIndex]?.isVariation && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs mr-2">
                                Variation
                              </span>
                            )}
                            Fitness: {(generatedPlans[currentPlanIndex]?.fitness ?? 0).toFixed(2)}
                          </div>
                        </div>

                        {/* Konva Canvas Floor Plan */}
                        <KonvaFloorPlan
                          floorPlanData={generatedPlans[currentPlanIndex]}
                          width={800}
                          height={500}
                          onRoomUpdate={() => {}}
                          isEditable={false}
                        />

                        {/* Instructions */}
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="text-sm text-blue-900 font-medium mb-1">Interactive Floor Plan</div>
                          <div className="text-xs text-blue-700 space-y-1">
                            <div>• Click "Customize Plan" to open the interactive editor</div>
                            <div>• Use "Generate Variations" to create new GA-optimized plans</div>
                            <div>• Navigate between different plan variations</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Plan Overview - Better visibility thumbnails */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        All Variations ({generatedPlans.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {generatedPlans.map((plan, index) => (
                          <div
                            key={plan.id ?? index}
                            className="flex-shrink-0 text-center"
                          >
                            <button
                              onClick={() => setCurrentPlanIndex(index)}
                              className={`w-full aspect-square rounded-lg border-2 p-2 transition-all ${
                                index === currentPlanIndex 
                                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                              }`}
                            >
                              <div className="w-full h-32 mb-2 flex items-center justify-center bg-gray-50 rounded">
                                {plan && plan.rooms && plan.rooms.length > 0 ? (
                                  <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Custom SVG Floor Plan Preview */}
                                    {createFloorPlanPreview(plan)}
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                                    <div className="text-xs text-gray-400 text-center">
                                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                      <div>Floor Plan</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                            <div className="text-xs text-gray-600 mt-2 space-y-1">
                              <div className="font-medium">Plan {index + 1}</div>
                              {plan.isVariation && (
                                <div className="text-purple-600 text-xs bg-purple-100 px-2 py-0.5 rounded">
                                  Variation
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Color Legend */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Room Color Guide:</h5>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded" style={{backgroundColor: '#FFB3BA'}}></div>
                            <span>Living</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded" style={{backgroundColor: '#BAFFC9'}}></div>
                            <span>Bedroom</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded" style={{backgroundColor: '#FFFFBA'}}></div>
                            <span>Kitchen</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded" style={{backgroundColor: '#BAE1FF'}}></div>
                            <span>Bathroom</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded" style={{backgroundColor: '#FFDFBA'}}></div>
                            <span>Drawing</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded" style={{backgroundColor: '#E0BBE4'}}></div>
                            <span>Car Porch</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded" style={{backgroundColor: '#C7CEEA'}}></div>
                            <span>Garden</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded border border-gray-300" style={{backgroundColor: '#8B4513'}}></div>
                            <span>Door</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Navigation hints */}
                      <div className="mt-4 text-xs text-gray-500 text-center">
                        Click on any variation to view it in detail above
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-gray-900">Ready to Generate</h3>
                        <p className="text-gray-600 max-w-md mx-auto text-sm">
                          Configure your space requirements and generate AI-powered floor plan variations
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Advanced Configuration */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border-4 border-[#ED7600] overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a]">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#ED7600] rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Advanced Setup</h2>
                    <p className="text-sm text-gray-200">Room connections & generation</p>
                  </div>
                </div>
              </div>

              {/* Right Forms Container */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Room Connections */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => toggleSection('connections')}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 bg-purple-600 text-white rounded-md flex items-center justify-center text-sm font-medium">3</div>
                        <span className="font-medium text-gray-900">Room Connections</span>
                      </div>
                      <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${collapsedSections.connections ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {!collapsedSections.connections && (
                      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                        <div className="text-sm text-gray-600 mb-3">
                          Define which rooms should be connected to each other. This helps the AI optimize the floor plan layout.
                        </div>

                        {/* Connection List */}
                        <div className="space-y-3">
                          {formData.roomConnections.map((connection, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center space-x-3">
                              <select
                                value={connection.from}
                                onChange={(e) => updateRoomConnection(index, 'from', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                              >
                                <option value="">Select room</option>
                                {getSelectedRooms().map(roomTag => (
                                  <option key={roomTag} value={roomTag}>
                                    {roomTag.replace('-', ' ').toUpperCase()}
                                  </option>
                                ))}
                              </select>
                              
                              <div className="flex items-center px-3 py-2 text-gray-500 text-sm font-medium">
                                ↔
                              </div>
                              
                              <select
                                value={connection.to}
                                onChange={(e) => updateRoomConnection(index, 'to', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                              >
                                <option value="">Select room</option>
                                {getSelectedRooms().map(roomTag => (
                                  <option key={roomTag} value={roomTag}>
                                    {roomTag.replace('-', ' ').toUpperCase()}
                                  </option>
                                ))}
                              </select>
                              
                              <button
                                type="button"
                                onClick={() => removeRoomConnection(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Connection Button */}
                        <button
                          type="button"
                          onClick={addRoomConnection}
                          disabled={getSelectedRooms().length < 2}
                          className="w-full bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add Room Connection</span>
                        </button>

                        {getSelectedRooms().length < 2 && (
                          <p className="text-amber-600 text-sm text-center">
                            Configure at least 2 rooms to add connections
                          </p>
                        )}

                        {formData.roomConnections.length === 0 && getSelectedRooms().length >= 2 && (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No room connections defined yet</p>
                            <p className="text-xs mt-1">Click "Add Room Connection" to connect rooms</p>
                          </div>
                        )}

                        {/* Connection Summary */}
                        {formData.roomConnections.length > 0 && (
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="text-sm font-medium text-green-900 mb-2">
                              Active Connections ({formData.roomConnections.length})
                            </div>
                            <div className="text-xs text-green-700 space-y-1">
                              {formData.roomConnections.map((conn, idx) => (
                                <div key={idx}>
                                  {conn.from && conn.to ? (
                                    `${conn.from.replace('-', ' ').toUpperCase()} ↔ ${conn.to.replace('-', ' ').toUpperCase()}`
                                  ) : (
                                    'Incomplete connection'
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Genetic Algorithm Parameters */}
                  {generatedPlans.length > 0 && (
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => toggleSection('ga-params')}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-7 h-7 bg-purple-600 text-white rounded-md flex items-center justify-center text-sm font-medium">GA</div>
                          <span className="font-medium text-gray-900">GA Parameters</span>
                        </div>
                        <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${collapsedSections['ga-params'] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {!collapsedSections['ga-params'] && (
                        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                          <div className="text-sm text-gray-600 mb-3">
                            Fine-tune genetic algorithm parameters for variations.
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Population Size</label>
                              <input
                                type="number"
                                min="10"
                                max="100"
                                defaultValue="20"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mutation Rate</label>
                              <input
                                type="range"
                                min="0.01"
                                max="0.5"
                                step="0.01"
                                defaultValue="0.1"
                                className="w-full"
                              />
                              <div className="text-xs text-gray-500 mt-1">10%</div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Crossover Rate</label>
                              <input
                                type="range"
                                min="0.5"
                                max="1.0"
                                step="0.05"
                                defaultValue="0.7"
                                className="w-full"
                              />
                              <div className="text-xs text-gray-500 mt-1">70%</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generation Controls */}
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-7 h-7 bg-green-600 text-white rounded-md flex items-center justify-center text-sm font-medium">2</div>
                        <span className="font-medium text-gray-900">Generation Controls</span>
                      </div>
                      
                      {/* Configuration Summary */}
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Plot Size:</span>
                          <span className="font-medium">{formData.plotDimensions.width}×{formData.plotDimensions.height}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Rooms:</span>
                          <span className="font-medium">{getSelectedRooms().length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Area Coverage:</span>
                          <span className={`font-medium ${getTotalAreaPercentage() > 100 ? 'text-red-600' : 'text-green-600'}`}>
                            {getTotalAreaPercentage().toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Connections:</span>
                          <span className="font-medium">{formData.roomConnections.filter(conn => conn.from && conn.to).length}</span>
                        </div>
                      </div>

                      {/* Two Separate Generate Buttons */}
                      <div className="space-y-3">
                        {/* Genetic Algorithm Button */}
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={(isGenerating && generatingEngine === 'ga') || getSelectedRooms().length === 0 || getTotalAreaPercentage() > 100}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg transform hover:scale-105 disabled:hover:scale-100"
                        >
                          {isGenerating && generatingEngine === 'ga' ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Generating with Genetic Algorithm...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span>Generate with Genetic Algorithm 🧬</span>
                            </>
                          )}
                        </button>

                        {/* Divider with OR */}
                        <div className="flex items-center">
                          <div className="flex-1 border-t-2 border-gray-300"></div>
                          <span className="px-4 text-gray-500 font-semibold text-sm">OR</span>
                          <div className="flex-1 border-t-2 border-gray-300"></div>
                        </div>

                        {/* Generative AI Button */}
                        <button
                          type="button"
                          onClick={handleGenAISubmit}
                          disabled={(isGenerating && generatingEngine === 'genai') || getSelectedRooms().length === 0 || getTotalAreaPercentage() > 100}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg transform hover:scale-105 disabled:hover:scale-100"
                        >
                          {isGenerating && generatingEngine === 'genai' ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Generating with Generative AI...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span>Generate with Generative AI ✨</span>
                            </>
                          )}
                        </button>

                        {/* Info Box */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                          <div className="flex">
                            <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="text-xs text-blue-800">
                              <p className="font-semibold mb-1">Choose Your AI Engine:</p>
                              <ul className="space-y-0.5">
                                <li>• <strong>Genetic Algorithm:</strong> Fast & precise optimization</li>
                                <li>• <strong>Generative AI:</strong> Creative AI-powered generation</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Generate Variations Button */}
                      {generatedPlans.length > 0 && (
                        <button
                          type="button"
                          onClick={generateVariations}
                          disabled={isGenerating}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3"
                        >
                          {isGenerating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Generating Variations...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Generate Variations</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Validation Messages */}
                      {(getSelectedRooms().length === 0 || getTotalAreaPercentage() > 100) && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-sm text-red-700 space-y-1">
                            {getSelectedRooms().length === 0 && (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span>Configure at least one room</span>
                              </div>
                            )}
                            {getTotalAreaPercentage() > 100 && (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span>Total area exceeds 100%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanGenerator;