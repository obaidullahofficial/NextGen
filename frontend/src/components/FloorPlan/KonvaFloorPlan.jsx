import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Line, Group, Arc, Circle } from 'react-konva';

const KonvaFloorPlan = ({ 
  floorPlanData, 
  width = 800, 
  height = 600, 
  onRoomUpdate,
  isEditable = false 
}) => {
  const [rooms, setRooms] = useState([]);
  const [walls, setWalls] = useState([]);
  const [doors, setDoors] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDoor, setSelectedDoor] = useState(null);
  const [selectedWall, setSelectedWall] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'room', 'door', 'wall'
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState(25);
  const [creationMode, setCreationMode] = useState(null); // 'door', 'wall', null
  const [isCreating, setIsCreating] = useState(false);
  const [newElementStart, setNewElementStart] = useState(null);
  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);
  const [doorColor, setDoorColor] = useState('#8B4513');
  const [wallColor, setWallColor] = useState('#000000');
  const [doorWidth, setDoorWidth] = useState(6);
  const [wallWidth, setWallWidth] = useState(4);
  const [totalFloorArea, setTotalFloorArea] = useState(10000); // Total area in square units
  const [roomPercentages, setRoomPercentages] = useState({}); // Room ID -> percentage mapping
  const [availablePercentage, setAvailablePercentage] = useState(100);
  const [roomTypeDistribution, setRoomTypeDistribution] = useState({}); // Room type -> total percentage
  const stageRef = useRef();

  // Snap to grid helper function
  const snapToGridCoordinate = useCallback((value) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isEditable) return;
      
      // Delete selected item
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRoom) {
          removeRoomAndRebalance(selectedRoom);
          setSelectedRoom(null);
        } else if (selectedDoor) {
          const updatedDoors = doors.filter(d => d.id !== selectedDoor);
          setDoors(updatedDoors);
          setSelectedDoor(null);
        } else if (selectedWall) {
          const updatedWalls = walls.filter(w => w.id !== selectedWall);
          setWalls(updatedWalls);
          setSelectedWall(null);
        }
      }
      
      // Deselect all with Escape
      if (e.key === 'Escape') {
        setSelectedRoom(null);
        setSelectedDoor(null);
        setSelectedWall(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditable, selectedRoom, selectedDoor, selectedWall, rooms, doors, walls]);

  // Convert backend data to Konva-friendly format
  useEffect(() => {
    if (floorPlanData) {
      console.log('=== FLOOR PLAN DATA DEBUG ===');
      console.log('floorPlanData:', floorPlanData);
      console.log('mapData:', floorPlanData.mapData);
      console.log('mapData length:', floorPlanData.mapData?.length);
      
      if (floorPlanData.mapData) {
        const doors = floorPlanData.mapData.filter(item => item.type === 'Door');
        const walls = floorPlanData.mapData.filter(item => item.type === 'Wall');
        console.log('Found walls:', walls.length);
        console.log('Found doors:', doors.length);
        console.log('Door items:', doors);
      }
      
      // Calculate scaling factors to fit the floor plan within canvas boundaries
      const plotWidth = 1000; // Default backend plot width
      const plotHeight = 1000; // Default backend plot height
      const margin = 40; // Margin from canvas edges
      
      const scaleX = (width - margin * 2) / plotWidth;
      const scaleY = (height - margin * 2) / plotHeight;
      const scale = Math.min(scaleX, scaleY); // Use uniform scaling to maintain aspect ratio
      
      // Convert rooms data with proper scaling
      const roomsData = (floorPlanData.rooms || []).map((room, index) => ({
        id: room.id || `room-${index}`,
        x: (room.x || 0) * scale + margin,
        y: (room.y || 0) * scale + margin,
        width: (room.width || 100) * scale,
        height: (room.height || 100) * scale,
        fill: getRoomColor(room.type || room.tag),
        stroke: '#333',
        strokeWidth: 2,
        draggable: isEditable,
        type: room.type || room.tag || 'Room',
        tag: room.tag || `room-${index}`,
        name: getRoomName(room.type || room.tag),
        originalX: room.x || 0,
        originalY: room.y || 0,
        originalWidth: room.width || 100,
        originalHeight: room.height || 100,
        scale: scale
      }));

      // Convert walls data with proper scaling
      const wallsData = (floorPlanData.mapData || [])
        .filter(item => item.type === 'Wall')
        .map((wall, index) => ({
          id: `wall-${index}`,
          points: [
            (wall.x1 || 0) * scale + margin, 
            (wall.y1 || 0) * scale + margin, 
            (wall.x2 || 0) * scale + margin, 
            (wall.y2 || 0) * scale + margin
          ],
          stroke: '#000',
          strokeWidth: Math.max(1, 4 * scale),
          lineCap: 'round'
        }));

      // Convert doors data with proper scaling - check multiple possible data sources
      let doorsData = [];
      
      // Method 1: Check mapData for doors
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData)) {
        const mapDoors = floorPlanData.mapData
          .filter(item => item.type === 'Door')
          .map((door, index) => ({
            id: `door-${index}`,
            points: [
              (door.x1 || 0) * scale + margin, 
              (door.y1 || 0) * scale + margin, 
              (door.x2 || 0) * scale + margin, 
              (door.y2 || 0) * scale + margin
            ],
            stroke: '#8B4513',
            strokeWidth: Math.max(6, 4 * scale),
            lineCap: 'round'
          }));
        doorsData = [...doorsData, ...mapDoors];
      }
      
      // Method 2: Check direct doors array
      if (floorPlanData.doors && Array.isArray(floorPlanData.doors)) {
        const directDoors = floorPlanData.doors.map((door, index) => ({
          id: `direct-door-${index}`,
          points: [
            (door.x1 || 0) * scale + margin, 
            (door.y1 || 0) * scale + margin, 
            (door.x2 || 0) * scale + margin, 
            (door.y2 || 0) * scale + margin
          ],
          stroke: '#8B4513',
          strokeWidth: Math.max(6, 4 * scale),
          lineCap: 'round'
        }));
        doorsData = [...doorsData, ...directDoors];
      }
      
      // Method 3: Auto-generate doors on room walls if no doors found
      if (doorsData.length === 0 && roomsData.length > 0) {
        console.log('No doors found in data, generating doors on room walls');
        const generatedDoors = [];
        
        roomsData.forEach((room, roomIndex) => {
          // Add door to the front wall (bottom edge) of each room
          const doorWidth = Math.min(80 * scale, room.width * 0.3); // Door width is 30% of room width or 80 scaled units
          const doorX = room.x + (room.width - doorWidth) / 2; // Center the door on the wall
          const doorY = room.y + room.height; // Bottom edge of room
          
          generatedDoors.push({
            id: `generated-door-${roomIndex}`,
            points: [
              doorX, 
              doorY, 
              doorX + doorWidth, 
              doorY
            ],
            stroke: '#8B4513',
            strokeWidth: Math.max(6, 4 * scale),
            lineCap: 'round',
            roomId: room.id
          });
        });
        
        doorsData = [...doorsData, ...generatedDoors];
        console.log('Generated doors:', generatedDoors.length);
      }

      const finalDoorsData = doorsData;
      
      setRooms(roomsData);
      setWalls(wallsData);
      setDoors(finalDoorsData);
      
      console.log('=== DOOR PLACEMENT DEBUG ===');
      console.log('Final doors data:', finalDoorsData);
      console.log('Rooms data:', roomsData);
      console.log('Scale factor:', scale);
      console.log('Margin:', margin);
    }
  }, [floorPlanData, isEditable]);

  // Get room color based on type
  const getRoomColor = (roomType) => {
    const colors = {
      'livingroom': '#e3f2fd',
      'kitchen': '#fff3e0',
      'bedroom': '#f3e5f5',
      'bathroom': '#e8f5e8',
      'carporch': '#f1f8e9',
      'garden': '#e8f5e8',
      'drawingroom': '#fce4ec'
    };
    
    if (!roomType) return '#f5f5f5';
    const type = roomType.split('-')[0].toLowerCase();
    return colors[type] || '#f5f5f5';
  };

  // Get room display name
  const getRoomName = (roomType) => {
    if (!roomType) return 'Room';
    const type = roomType.split('-')[0];
    const number = roomType.split('-')[1] || '1';
    return `${type.toUpperCase()} ${number}`;
  };

  // Calculate door swing properties
  const calculateDoorSwing = (x1, y1, x2, y2) => {
    const doorLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const doorAngle = Math.atan2(y2 - y1, x2 - x1);
    
    // Determine swing direction (perpendicular to door)
    const swingAngle = doorAngle + Math.PI / 2;
    
    // Calculate swing end point (90-degree opening)
    const swingEndX = x1 + Math.cos(swingAngle) * doorLength * 0.9;
    const swingEndY = y1 + Math.sin(swingAngle) * doorLength * 0.9;
    
    // Calculate arc points for door swing
    const arcPoints = [];
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const currentAngle = doorAngle + (swingAngle - doorAngle) * t;
      const arcX = x1 + Math.cos(currentAngle) * doorLength * 0.8;
      const arcY = y1 + Math.sin(currentAngle) * doorLength * 0.8;
      arcPoints.push(arcX, arcY);
    }
    
    return {
      doorLength,
      doorAngle: doorAngle * 180 / Math.PI,
      swingAngle: swingAngle * 180 / Math.PI,
      swingEndX,
      swingEndY,
      arcPoints
    };
  };

  // Handle room drag start
  const handleRoomDragStart = useCallback((e, roomId) => {
    if (!isEditable) return;
    
    const room = rooms.find(r => r.id === roomId);
    setDragStart({ x: room.x, y: room.y });
    setSelectedRoom(roomId);
    setSelectedDoor(null);
    setSelectedWall(null);
    setIsDragging(true);
    setDragType('room');
  }, [rooms, isEditable]);

  // Handle door drag start
  const handleDoorDragStart = useCallback((e, doorId) => {
    if (!isEditable) return;
    
    const door = doors.find(d => d.id === doorId);
    if (!door) return;
    
    // Store the initial drag position (this will be used as reference)
    setDragStart({ x: e.target.x(), y: e.target.y() });
    setSelectedDoor(doorId);
    setSelectedRoom(null);
    setSelectedWall(null);
    setIsDragging(true);
    setDragType('door');
    
    console.log('Door drag started:', {
      doorId,
      points: door.points,
      startPos: { x: e.target.x(), y: e.target.y() }
    });
  }, [doors, isEditable]);

  // Handle wall drag start
  const handleWallDragStart = useCallback((e, wallId) => {
    if (!isEditable) return;
    
    const wall = walls.find(w => w.id === wallId);
    setDragStart({ x: wall.points[0], y: wall.points[1] });
    setSelectedWall(wallId);
    setSelectedRoom(null);
    setSelectedDoor(null);
    setIsDragging(true);
    setDragType('wall');
  }, [walls, isEditable]);

  // Handle room drag end - with free movement and overlapping allowed
  const handleRoomDragEnd = useCallback((e, roomId) => {
    if (!isEditable) return;

    const newX = e.target.x();
    const newY = e.target.y();
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) return;
    
    const margin = 40;
    
    // Apply snap to grid but allow free movement (no boundary constraints for overlapping)
    const snappedX = snapToGridCoordinate(newX);
    const snappedY = snapToGridCoordinate(newY);

    // Convert back to original coordinates for backend
    const originalX = (snappedX - margin) / room.scale;
    const originalY = (snappedY - margin) / room.scale;

    // Update room position with free movement - no constraints
    const updatedRooms = rooms.map(r => 
      r.id === roomId 
        ? { ...r, x: snappedX, y: snappedY, originalX, originalY }
        : r
    );

    setRooms(updatedRooms);
    setIsDragging(false);
    setDragType(null);

    // Send update to parent component with original coordinates
    if (onRoomUpdate) {
      onRoomUpdate(roomId, {
        x: originalX,
        y: originalY,
        width: room.originalWidth,
        height: room.originalHeight
      });
    }

    console.log(`Room ${roomId} moved freely to:`, {
      screenPosition: { x: snappedX, y: snappedY },
      originalPosition: { x: originalX, y: originalY },
      overlapping: 'allowed'
    });
  }, [rooms, isEditable, onRoomUpdate, snapToGridCoordinate]);

  // Handle room drag move for visual feedback
  const handleRoomDragMove = useCallback((e, roomId) => {
    if (!isEditable || !isDragging) return;
    
    // Apply snap to grid during drag for visual feedback
    const currentX = snapToGridCoordinate(e.target.x());
    const currentY = snapToGridCoordinate(e.target.y());
    
    // Update target position to snapped coordinates
    e.target.position({ x: currentX, y: currentY });
  }, [isEditable, isDragging, snapToGridCoordinate]);

  // Helper function to find the nearest wall edge for door placement
  const findNearestWallEdge = useCallback((x, y, doorLength) => {
    let nearestWall = null;
    let minDistance = Infinity;
    let snapPosition = null;
    
    rooms.forEach(room => {
      const walls = [
        // Top wall
        { x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y, edge: 'top' },
        // Right wall  
        { x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.height, edge: 'right' },
        // Bottom wall
        { x1: room.x, y1: room.y + room.height, x2: room.x + room.width, y2: room.y + room.height, edge: 'bottom' },
        // Left wall
        { x1: room.x, y1: room.y, x2: room.x, y2: room.y + room.height, edge: 'left' }
      ];
      
      walls.forEach(wall => {
        // Calculate distance from point to wall line
        const wallLength = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2);
        const wallUnitX = (wall.x2 - wall.x1) / wallLength;
        const wallUnitY = (wall.y2 - wall.y1) / wallLength;
        
        // Project point onto wall line
        const toPointX = x - wall.x1;
        const toPointY = y - wall.y1;
        const projectionLength = toPointX * wallUnitX + toPointY * wallUnitY;
        
        // Clamp projection to wall bounds
        const clampedProjection = Math.max(0, Math.min(wallLength, projectionLength));
        
        // Calculate closest point on wall
        const closestX = wall.x1 + wallUnitX * clampedProjection;
        const closestY = wall.y1 + wallUnitY * clampedProjection;
        
        // Calculate distance
        const distance = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
        
        // Check if we can fit the door on this wall segment
        const availableLength = wallLength;
        const doorCanFit = doorLength <= availableLength;
        
        if (distance < minDistance && doorCanFit && distance < 50) { // 50px snap threshold
          minDistance = distance;
          nearestWall = { ...wall, room };
          
          // Calculate door position centered on the closest point
          const doorStartX = closestX - (wallUnitX * doorLength / 2);
          const doorStartY = closestY - (wallUnitY * doorLength / 2);
          const doorEndX = closestX + (wallUnitX * doorLength / 2);
          const doorEndY = closestY + (wallUnitY * doorLength / 2);
          
          snapPosition = {
            x1: doorStartX,
            y1: doorStartY,
            x2: doorEndX,
            y2: doorEndY
          };
        }
      });
    });
    
    return { nearestWall, snapPosition, distance: minDistance };
  }, [rooms]);

  // Handle door drag end
  const handleDoorDragEnd = useCallback((e, doorId) => {
    if (!isEditable) return;

    const door = doors.find(d => d.id === doorId);
    if (!door) return;
    
    const margin = 40;
    
    // Get the drag offset from the drag start position
    const dragOffsetX = e.target.x() - dragStart.x;
    const dragOffsetY = e.target.y() - dragStart.y;
    
    // Calculate new door center position
    const doorCenterX = (door.points[0] + door.points[2]) / 2 + dragOffsetX;
    const doorCenterY = (door.points[1] + door.points[3]) / 2 + dragOffsetY;
    
    // Calculate door length
    const doorLength = Math.sqrt(
      (door.points[2] - door.points[0]) ** 2 + 
      (door.points[3] - door.points[1]) ** 2
    );
    
    // Find nearest wall edge
    const { nearestWall, snapPosition, distance } = findNearestWallEdge(doorCenterX, doorCenterY, doorLength);
    
    let finalDoorPoints;
    
    if (nearestWall && snapPosition) {
      // Snap to wall
      finalDoorPoints = [snapPosition.x1, snapPosition.y1, snapPosition.x2, snapPosition.y2];
      console.log('Door snapped to wall:', nearestWall.edge, 'of room:', nearestWall.room.id);
    } else {
      // Return to original position if no valid wall found
      finalDoorPoints = door.points;
      console.log('Door returned to original position - no valid wall nearby');
    }
    
    // Update door position
    const updatedDoors = doors.map(d => 
      d.id === doorId 
        ? { ...d, points: finalDoorPoints }
        : d
    );

    setDoors(updatedDoors);
    setIsDragging(false);
    setDragType(null);
    
    // Reset target position to prevent visual jumping
    e.target.position({ x: 0, y: 0 });
    
    console.log('Door drag completed:', {
      doorId,
      oldPoints: door.points,
      newPoints: finalDoorPoints,
      wallFound: !!nearestWall,
      snapDistance: distance
    });
  }, [doors, width, height, isEditable, dragStart, findNearestWallEdge]);

  // Add new door
  const addNewDoor = useCallback(() => {
    const newDoor = {
      id: `new-door-${Date.now()}`,
      points: [200, 200, 280, 200], // Default horizontal door
      stroke: '#8B4513',
      strokeWidth: 6,
      lineCap: 'round'
    };
    setDoors(prev => [...prev, newDoor]);
    setSelectedDoor(newDoor.id);
    setSelectedRoom(null);
    setSelectedWall(null);
  }, []);

  // Add new wall
  const addNewWall = useCallback(() => {
    const newWall = {
      id: `new-wall-${Date.now()}`,
      points: [300, 300, 400, 300], // Default horizontal wall
      stroke: '#000',
      strokeWidth: 4,
      lineCap: 'round'
    };
    setWalls(prev => [...prev, newWall]);
    setSelectedWall(newWall.id);
    setSelectedRoom(null);
    setSelectedDoor(null);
  }, []);

  // Calculate area from room dimensions
  const calculateRoomArea = useCallback((width, height, scale = 1) => {
    const actualWidth = width / scale;
    const actualHeight = height / scale;
    return actualWidth * actualHeight;
  }, []);

  // Calculate percentage of total area
  const calculateAreaPercentage = useCallback((area) => {
    return (area / totalFloorArea) * 100;
  }, [totalFloorArea]);

  // Get room area from percentage
  const getAreaFromPercentage = useCallback((percentage) => {
    return (percentage / 100) * totalFloorArea;
  }, [totalFloorArea]);

  // Rebalance all room percentages to maintain 100% total
  const rebalanceRoomPercentages = useCallback((updatedRooms, excludeRoomId = null) => {
    const totalCurrentPercentage = Object.values(roomPercentages).reduce((sum, percent) => sum + percent, 0);
    
    if (totalCurrentPercentage === 0) return roomPercentages;

    const newPercentages = { ...roomPercentages };
    
    // If we're updating a specific room, adjust others proportionally
    if (excludeRoomId && newPercentages[excludeRoomId]) {
      const excludedPercentage = newPercentages[excludeRoomId];
      const remainingPercentage = 100 - excludedPercentage;
      const otherRoomsTotal = totalCurrentPercentage - excludedPercentage;
      
      if (otherRoomsTotal > 0) {
        // Proportionally adjust other rooms
        updatedRooms.forEach(room => {
          if (room.id !== excludeRoomId && newPercentages[room.id]) {
            const currentPercent = newPercentages[room.id];
            newPercentages[room.id] = (currentPercent / otherRoomsTotal) * remainingPercentage;
          }
        });
      }
    } else {
      // Proportionally adjust all rooms to sum to 100%
      const scaleFactor = 100 / totalCurrentPercentage;
      updatedRooms.forEach(room => {
        if (newPercentages[room.id]) {
          newPercentages[room.id] *= scaleFactor;
        }
      });
    }

    return newPercentages;
  }, [roomPercentages]);

  // Add new room with area allocation
  const addRoomWithAreaAllocation = useCallback((roomData, requestedPercentage = null) => {
    const defaultPercentage = requestedPercentage || 20; // Default 20% for new rooms
    const currentTotal = Object.values(roomPercentages).reduce((sum, percent) => sum + percent, 0);
    
    let newPercentage = defaultPercentage;
    
    // If adding this room would exceed 100%, take from available or rebalance
    if (currentTotal + newPercentage > 100) {
      if (currentTotal < 100) {
        newPercentage = 100 - currentTotal; // Take remaining available
      } else {
        newPercentage = defaultPercentage;
        // Rebalance existing rooms to make space
        const rebalanceFactor = (100 - newPercentage) / currentTotal;
        const updatedPercentages = {};
        Object.keys(roomPercentages).forEach(roomId => {
          updatedPercentages[roomId] = roomPercentages[roomId] * rebalanceFactor;
        });
        setRoomPercentages(updatedPercentages);
      }
    }

    // Calculate room dimensions based on percentage
    const targetArea = getAreaFromPercentage(newPercentage);
    const aspectRatio = (roomData.width || 150) / (roomData.height || 100);
    const newHeight = Math.sqrt(targetArea / aspectRatio);
    const newWidth = newHeight * aspectRatio;

    const updatedRoom = {
      ...roomData,
      width: newWidth,
      height: newHeight,
      originalWidth: newWidth,
      originalHeight: newHeight
    };

    // Update room percentages
    setRoomPercentages(prev => ({
      ...prev,
      [roomData.id]: newPercentage
    }));

    return updatedRoom;
  }, [roomPercentages, getAreaFromPercentage]);

  // Update room percentage and adjust dimensions
  const updateRoomPercentage = useCallback((roomId, newPercentage) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Update percentages with rebalancing
    const updatedPercentages = { ...roomPercentages, [roomId]: newPercentage };
    const rebalanced = rebalanceRoomPercentages(rooms, roomId);
    rebalanced[roomId] = newPercentage;
    
    setRoomPercentages(rebalanced);

    // Calculate new dimensions based on percentage
    const targetArea = getAreaFromPercentage(newPercentage);
    const aspectRatio = room.width / room.height;
    const newHeight = Math.sqrt(targetArea / aspectRatio);
    const newWidth = newHeight * aspectRatio;

    // Update room dimensions
    const updatedRooms = rooms.map(r => 
      r.id === roomId 
        ? { 
            ...r, 
            width: newWidth * (r.scale || 1), 
            height: newHeight * (r.scale || 1),
            originalWidth: newWidth,
            originalHeight: newHeight
          }
        : r
    );

    setRooms(updatedRooms);

    if (onRoomUpdate) {
      onRoomUpdate(roomId, {
        x: room.originalX,
        y: room.originalY,
        width: newWidth,
        height: newHeight
      });
    }
  }, [rooms, roomPercentages, rebalanceRoomPercentages, getAreaFromPercentage, onRoomUpdate]);

  // Remove room and rebalance percentages
  const removeRoomAndRebalance = useCallback((roomId) => {
    const updatedRooms = rooms.filter(r => r.id !== roomId);
    const updatedPercentages = { ...roomPercentages };
    delete updatedPercentages[roomId];
    
    // Rebalance remaining rooms to 100%
    if (Object.keys(updatedPercentages).length > 0) {
      const rebalanced = rebalanceRoomPercentages(updatedRooms);
      setRoomPercentages(rebalanced);
    } else {
      setRoomPercentages({});
    }
    
    setRooms(updatedRooms);
  }, [rooms, roomPercentages, rebalanceRoomPercentages]);

  // Initialize room percentages when rooms change
  useEffect(() => {
    const newPercentages = { ...roomPercentages };
    let hasChanges = false;

    rooms.forEach(room => {
      if (!newPercentages[room.id]) {
        const roomArea = calculateRoomArea(room.width, room.height, room.scale || 1);
        const percentage = calculateAreaPercentage(roomArea);
        newPercentages[room.id] = percentage;
        hasChanges = true;
      }
    });

    // Remove percentages for deleted rooms
    Object.keys(newPercentages).forEach(roomId => {
      if (!rooms.find(r => r.id === roomId)) {
        delete newPercentages[roomId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      // Rebalance to ensure 100% total
      const rebalanced = rebalanceRoomPercentages(rooms);
      setRoomPercentages(rebalanced);
    }
  }, [rooms, roomPercentages, calculateRoomArea, calculateAreaPercentage, rebalanceRoomPercentages]);

  // Calculate available percentage
  useEffect(() => {
    const used = Object.values(roomPercentages).reduce((sum, percent) => sum + percent, 0);
    setAvailablePercentage(Math.max(0, 100 - used));
  }, [roomPercentages]);

  // Update room type distribution when rooms change
  useEffect(() => {
    const typeDistribution = {};
    
    rooms.forEach(room => {
      const roomType = room.type || room.tag || 'Room';
      const percentage = roomPercentages[room.id] || 0;
      
      if (!typeDistribution[roomType]) {
        typeDistribution[roomType] = 0;
      }
      typeDistribution[roomType] += percentage;
    });
    
    setRoomTypeDistribution(typeDistribution);
  }, [rooms, roomPercentages]);

  // Get rooms of same type
  const getRoomsOfType = useCallback((roomType) => {
    return rooms.filter(room => (room.type || room.tag || 'Room') === roomType);
  }, [rooms]);

  // Distribute percentage equally among rooms of same type
  const distributeTypePercentage = useCallback((roomType, totalPercentage) => {
    const roomsOfType = getRoomsOfType(roomType);
    if (roomsOfType.length === 0) return;
    
    const percentagePerRoom = totalPercentage / roomsOfType.length;
    
    roomsOfType.forEach(room => {
      updateRoomPercentage(room.id, percentagePerRoom);
    });
  }, [getRoomsOfType, updateRoomPercentage]);

  // Customize selected door
  const customizeDoor = useCallback((property, value) => {
    if (!selectedDoor) return;
    
    const updatedDoors = doors.map(door => {
      if (door.id === selectedDoor) {
        return { ...door, [property]: value };
      }
      return door;
    });
    
    setDoors(updatedDoors);
  }, [selectedDoor, doors]);

  // Customize selected wall
  const customizeWall = useCallback((property, value) => {
    if (!selectedWall) return;
    
    const updatedWalls = walls.map(wall => {
      if (wall.id === selectedWall) {
        return { ...wall, [property]: value };
      }
      return wall;
    });
    
    setWalls(updatedWalls);
  }, [selectedWall, walls]);

  // Handle mouse move for creation preview
  const handleStageMouseMove = useCallback((e) => {
    if (!isEditable || !isCreating || !newElementStart) return;
    
    // Force re-render to update preview line
    const stage = e.target.getStage();
    if (stage) {
      stage.batchDraw();
    }
  }, [isEditable, isCreating, newElementStart]);

  // Handle door drag move (for visual feedback)
  const handleDoorDragMove = useCallback((e, doorId) => {
    if (!isEditable || !isDragging) return;
    
    const door = doors.find(d => d.id === doorId);
    if (!door) return;
    
    // Get current drag position
    const dragOffsetX = e.target.x() - dragStart.x;
    const dragOffsetY = e.target.y() - dragStart.y;
    
    // Calculate new door center position
    const doorCenterX = (door.points[0] + door.points[2]) / 2 + dragOffsetX;
    const doorCenterY = (door.points[1] + door.points[3]) / 2 + dragOffsetY;
    
    // Calculate door length
    const doorLength = Math.sqrt(
      (door.points[2] - door.points[0]) ** 2 + 
      (door.points[3] - door.points[1]) ** 2
    );
    
    // Find nearest wall for preview
    const { nearestWall, snapPosition } = findNearestWallEdge(doorCenterX, doorCenterY, doorLength);
    
    // Change door color based on whether it can snap to a wall
    const targetLine = e.target;
    if (nearestWall && snapPosition) {
      targetLine.stroke('#4CAF50'); // Green when near a valid wall
    } else {
      targetLine.stroke('#FF5722'); // Red when not near a valid wall
    }
    
    // Apply snap to grid during drag for visual feedback
    const currentX = snapToGridCoordinate(e.target.x());
    const currentY = snapToGridCoordinate(e.target.y());
    
    // Update target position to snapped coordinates
    e.target.position({ x: currentX, y: currentY });
  }, [isEditable, isDragging, snapToGridCoordinate, doors, dragStart, findNearestWallEdge]);

  // Handle wall drag end
  const handleWallDragEnd = useCallback((e, wallId) => {
    if (!isEditable) return;

    const newX = e.target.x();
    const newY = e.target.y();
    const wall = walls.find(w => w.id === wallId);
    
    if (!wall) return;
    
    const margin = 40;
    
    // Calculate wall length and maintain it
    const deltaX = wall.points[2] - wall.points[0];
    const deltaY = wall.points[3] - wall.points[1];
    const newEndX = newX + deltaX;
    const newEndY = newY + deltaY;
    
    // Constrain to stage bounds
    const constrainedX = Math.max(margin, Math.min(width - margin, newX));
    const constrainedY = Math.max(margin, Math.min(height - margin, newY));
    const constrainedEndX = Math.max(margin, Math.min(width - margin, newEndX));
    const constrainedEndY = Math.max(margin, Math.min(height - margin, newEndY));

    // Update wall position
    const updatedWalls = walls.map(w => 
      w.id === wallId 
        ? { ...w, points: [constrainedX, constrainedY, constrainedEndX, constrainedEndY] }
        : w
    );

    setWalls(updatedWalls);
    setIsDragging(false);
    setDragType(null);
  }, [walls, width, height, isEditable]);

  // Handle room resize (for corners)
  const handleResize = useCallback((roomId, newWidth, newHeight) => {
    if (!isEditable) return;
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const constrainedWidth = Math.max(50, newWidth);
    const constrainedHeight = Math.max(50, newHeight);

    // Convert back to original coordinates for backend
    const originalWidth = constrainedWidth / room.scale;
    const originalHeight = constrainedHeight / room.scale;
    const originalX = (room.x - 40) / room.scale; // margin = 40
    const originalY = (room.y - 40) / room.scale;

    const updatedRooms = rooms.map(r => 
      r.id === roomId 
        ? { 
            ...r, 
            width: constrainedWidth, 
            height: constrainedHeight,
            originalWidth,
            originalHeight,
            originalX,
            originalY
          }
        : r
    );

    setRooms(updatedRooms);

    // Send update to parent component with original coordinates
    if (onRoomUpdate) {
      onRoomUpdate(roomId, {
        x: originalX,
        y: originalY,
        width: originalWidth,
        height: originalHeight
      });
    }
  }, [rooms, isEditable, onRoomUpdate]);

  // Handle room selection
  const handleRoomClick = useCallback((e, roomId) => {
    e.cancelBubble = true;
    setSelectedRoom(selectedRoom === roomId ? null : roomId);
    setSelectedDoor(null);
    setSelectedWall(null);
  }, [selectedRoom]);

  // Handle door selection
  const handleDoorClick = useCallback((e, doorId) => {
    e.cancelBubble = true;
    setSelectedDoor(selectedDoor === doorId ? null : doorId);
    setSelectedRoom(null);
    setSelectedWall(null);
  }, [selectedDoor]);

  // Handle wall selection
  const handleWallClick = useCallback((e, wallId) => {
    e.cancelBubble = true;
    setSelectedWall(selectedWall === wallId ? null : wallId);
    setSelectedRoom(null);
    setSelectedDoor(null);
  }, [selectedWall]);

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e) => {
    if (!isEditable) return;
    
    // Check if clicked on empty area
    if (e.target === e.target.getStage()) {
      const pos = e.target.getPointerPosition();
      const snappedX = snapToGridCoordinate(pos.x);
      const snappedY = snapToGridCoordinate(pos.y);
      
      if (creationMode === 'room') {
        if (!isCreating) {
          // Start creating room
          setNewElementStart({ x: snappedX, y: snappedY });
          setIsCreating(true);
        } else {
          // Complete room creation
          const width = Math.abs(snappedX - newElementStart.x);
          const height = Math.abs(snappedY - newElementStart.y);
          const x = Math.min(snappedX, newElementStart.x);
          const y = Math.min(snappedY, newElementStart.y);
          
          const baseRoom = {
            id: `created-room-${Date.now()}`,
            x: x,
            y: y,
            width: width,
            height: height,
            fill: '#e3f2fd',
            stroke: '#333',
            strokeWidth: 2,
            draggable: isEditable,
            type: 'Room',
            tag: 'room',
            name: 'New Room',
            originalX: (x - 40) / 1, // Assuming scale 1 for new rooms
            originalY: (y - 40) / 1,
            originalWidth: width,
            originalHeight: height,
            scale: 1
          };
          
          // Calculate percentage based on drawn area
          const drawnArea = width * height;
          const requestedPercentage = calculateAreaPercentage(drawnArea);
          
          // Use area allocation system
          const roomWithArea = addRoomWithAreaAllocation(baseRoom, requestedPercentage);
          setRooms(prev => [...prev, roomWithArea]);
          setSelectedRoom(baseRoom.id);
          setIsCreating(false);
          setNewElementStart(null);
          setCreationMode(null);
        }
      } else if (creationMode === 'door') {
        if (!isCreating) {
          // Start creating door
          setNewElementStart({ x: snappedX, y: snappedY });
          setIsCreating(true);
        } else {
          // Complete door creation
          const newDoor = {
            id: `created-door-${Date.now()}`,
            points: [newElementStart.x, newElementStart.y, snappedX, snappedY],
            stroke: '#8B4513',
            strokeWidth: 6,
            lineCap: 'round'
          };
          setDoors(prev => [...prev, newDoor]);
          setSelectedDoor(newDoor.id);
          setIsCreating(false);
          setNewElementStart(null);
          setCreationMode(null);
        }
      } else if (creationMode === 'wall') {
        if (!isCreating) {
          // Start creating wall
          setNewElementStart({ x: snappedX, y: snappedY });
          setIsCreating(true);
        } else {
          // Complete wall creation
          const newWall = {
            id: `created-wall-${Date.now()}`,
            points: [newElementStart.x, newElementStart.y, snappedX, snappedY],
            stroke: '#000',
            strokeWidth: 4,
            lineCap: 'round'
          };
          setWalls(prev => [...prev, newWall]);
          setSelectedWall(newWall.id);
          setIsCreating(false);
          setNewElementStart(null);
          setCreationMode(null);
        }
      } else {
        // Normal click - deselect all
        setSelectedRoom(null);
        setSelectedDoor(null);
        setSelectedWall(null);
      }
    }
  }, [isEditable, creationMode, isCreating, newElementStart, snapToGridCoordinate]);

  // Resize handle component
  const ResizeHandle = ({ x, y, onDrag, cursor = 'nw-resize' }) => (
    <Rect
      x={x - 4}
      y={y - 4}
      width={8}
      height={8}
      fill="#2196F3"
      stroke="#1976D2"
      strokeWidth={1}
      draggable={isEditable}
      onDragMove={onDrag}
      style={{ cursor }}
    />
  );

  return (
    <div className="flex bg-gray-50">
      {/* Left Sidebar - Creation Tools */}
      {isEditable && (
        <div className="w-64 bg-white border-r border-gray-300 p-4 space-y-4 overflow-y-auto">
          {/* Creation Tools Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-900 mb-3">
              🔨 Creation Tools
            </div>
            
            <div className="space-y-2">
              {/* Add Door Button */}
              <button
                onClick={() => {
                  if (creationMode === 'door') {
                    setCreationMode(null);
                    setIsCreating(false);
                    setNewElementStart(null);
                  } else {
                    setCreationMode('door');
                    setIsCreating(false);
                    setNewElementStart(null);
                  }
                }}
                className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors ${
                  creationMode === 'door'
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {creationMode === 'door' ? '✓ Click to Place Door' : '🚪 Add Door'}
              </button>
              
              {/* Add Wall Button */}
              <button
                onClick={() => {
                  if (creationMode === 'wall') {
                    setCreationMode(null);
                    setIsCreating(false);
                    setNewElementStart(null);
                  } else {
                    setCreationMode('wall');
                    setIsCreating(false);
                    setNewElementStart(null);
                  }
                }}
                className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors ${
                  creationMode === 'wall'
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {creationMode === 'wall' ? '✓ Click to Place Wall' : '🧱 Add Wall'}
              </button>
              
              {/* Add Room Button */}
              <button
                onClick={() => {
                  if (creationMode === 'room') {
                    setCreationMode(null);
                    setIsCreating(false);
                    setNewElementStart(null);
                  } else {
                    setCreationMode('room');
                    setIsCreating(false);
                    setNewElementStart(null);
                  }
                }}
                className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors ${
                  creationMode === 'room'
                    ? 'bg-purple-100 border-purple-300 text-purple-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {creationMode === 'room' ? '✓ Click to Place Room' : '🏠 Add Room'}
              </button>

              {/* Quick Add Buttons */}
              <div className="border-t pt-2 mt-2">
                <div className="text-xs text-gray-600 mb-2">Quick Add:</div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      const baseRoom = {
                        id: `new-room-${Date.now()}`,
                        x: 200,
                        y: 200,
                        width: 150,
                        height: 100,
                        fill: '#e3f2fd',
                        stroke: '#333',
                        strokeWidth: 2,
                        draggable: isEditable,
                        type: 'Room',
                        tag: 'room',
                        name: 'New Room',
                        originalX: 200,
                        originalY: 200,
                        originalWidth: 150,
                        originalHeight: 100,
                        scale: 1
                      };
                      
                      // Use area allocation system
                      const roomWithArea = addRoomWithAreaAllocation(baseRoom, 20); // Request 20% default
                      setRooms(prev => [...prev, roomWithArea]);
                      setSelectedRoom(baseRoom.id);
                      setSelectedDoor(null);
                      setSelectedWall(null);
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 border border-blue-300 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                    title="Add room at center"
                  >
                    + Room
                  </button>
                  <button
                    onClick={addNewDoor}
                    className="px-2 py-1 text-xs bg-amber-100 border border-amber-300 text-amber-800 rounded hover:bg-amber-200 transition-colors"
                    title="Add door at center"
                  >
                    + Door
                  </button>
                  <button
                    onClick={addNewWall}
                    className="px-2 py-1 text-xs bg-slate-100 border border-slate-300 text-slate-800 rounded hover:bg-slate-200 transition-colors"
                    title="Add wall at center"
                  >
                    + Wall
                  </button>
                </div>
              </div>
              
              {/* Creation Instructions */}
              {creationMode && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                  {isCreating 
                    ? `Click to finish ${creationMode}` 
                    : `Click to start ${creationMode}, then click again to finish`
                  }
                </div>
              )}
              
              {/* Cancel Button */}
              {(creationMode || isCreating) && (
                <button
                  onClick={() => {
                    setCreationMode(null);
                    setIsCreating(false);
                    setNewElementStart(null);
                  }}
                  className="w-full px-3 py-1 text-xs bg-red-100 border border-red-300 text-red-800 rounded hover:bg-red-200 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Room Customization Panel */}
          {selectedRoom && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-900 mb-3">
                🏠 Customize Room
              </div>
              
              <div className="space-y-3">
                {/* Room Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Room Type
                  </label>
                  <select
                    value={rooms.find(r => r.id === selectedRoom)?.type || 'Room'}
                    onChange={(e) => {
                      const updatedRooms = rooms.map(room => 
                        room.id === selectedRoom 
                          ? { 
                              ...room, 
                              type: e.target.value,
                              fill: getRoomColor(e.target.value),
                              name: room.name || getRoomName(e.target.value)
                            }
                          : room
                      );
                      setRooms(updatedRooms);
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="livingroom">Living Room</option>
                    <option value="bedroom">Bedroom</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="bathroom">Bathroom</option>
                    <option value="drawingroom">Drawing Room</option>
                    <option value="carporch">Car Porch</option>
                    <option value="garden">Garden</option>
                    <option value="Room">Other</option>
                  </select>
                </div>

                {/* Room Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={rooms.find(r => r.id === selectedRoom)?.name || ''}
                    onChange={(e) => {
                      const updatedRooms = rooms.map(room => 
                        room.id === selectedRoom 
                          ? { ...room, name: e.target.value }
                          : room
                      );
                      setRooms(updatedRooms);
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="Enter room name"
                  />
                </div>

                {/* Room Area Percentage */}
                <div className="bg-blue-50 p-3 rounded border">
                  <label className="block text-xs font-medium text-blue-800 mb-2">
                    📊 Area Allocation: {(roomPercentages[selectedRoom] || 0).toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="0.5"
                    value={roomPercentages[selectedRoom] || 0}
                    onChange={(e) => updateRoomPercentage(selectedRoom, parseFloat(e.target.value))}
                    className="w-full mb-2"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="5"
                      max="80"
                      step="0.5"
                      value={(roomPercentages[selectedRoom] || 0).toFixed(1)}
                      onChange={(e) => updateRoomPercentage(selectedRoom, parseFloat(e.target.value))}
                      className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded"
                    />
                    <span className="text-xs text-blue-600">% of total</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Area: {((roomPercentages[selectedRoom] || 0) * totalFloorArea / 100).toFixed(0)} sq units
                  </div>
                </div>

                {/* Room Dimensions (Auto-calculated) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Width: {Math.round((rooms.find(r => r.id === selectedRoom)?.width || 0) / (rooms.find(r => r.id === selectedRoom)?.scale || 1))} units
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="500"
                    value={Math.round((rooms.find(r => r.id === selectedRoom)?.width || 0) / (rooms.find(r => r.id === selectedRoom)?.scale || 1))}
                    onChange={(e) => {
                      const room = rooms.find(r => r.id === selectedRoom);
                      if (room) {
                        const newWidth = parseInt(e.target.value) * room.scale;
                        const newArea = (newWidth / room.scale) * (room.height / room.scale);
                        const newPercentage = calculateAreaPercentage(newArea);
                        
                        // Update dimensions
                        const updatedRooms = rooms.map(r => 
                          r.id === selectedRoom 
                            ? { ...r, width: newWidth, originalWidth: parseInt(e.target.value) }
                            : r
                        );
                        setRooms(updatedRooms);
                        
                        // Update percentage and rebalance
                        updateRoomPercentage(selectedRoom, newPercentage);
                        
                        if (onRoomUpdate) {
                          onRoomUpdate(selectedRoom, {
                            x: room.originalX,
                            y: room.originalY,
                            width: parseInt(e.target.value),
                            height: room.originalHeight
                          });
                        }
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Height: {Math.round((rooms.find(r => r.id === selectedRoom)?.height || 0) / (rooms.find(r => r.id === selectedRoom)?.scale || 1))} units
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="500"
                    value={Math.round((rooms.find(r => r.id === selectedRoom)?.height || 0) / (rooms.find(r => r.id === selectedRoom)?.scale || 1))}
                    onChange={(e) => {
                      const room = rooms.find(r => r.id === selectedRoom);
                      if (room) {
                        const newHeight = parseInt(e.target.value) * room.scale;
                        const newArea = (room.width / room.scale) * (newHeight / room.scale);
                        const newPercentage = calculateAreaPercentage(newArea);
                        
                        // Update dimensions
                        const updatedRooms = rooms.map(r => 
                          r.id === selectedRoom 
                            ? { ...r, height: newHeight, originalHeight: parseInt(e.target.value) }
                            : r
                        );
                        setRooms(updatedRooms);
                        
                        // Update percentage and rebalance
                        updateRoomPercentage(selectedRoom, newPercentage);
                        
                        if (onRoomUpdate) {
                          onRoomUpdate(selectedRoom, {
                            x: room.originalX,
                            y: room.originalY,
                            width: room.originalWidth,
                            height: parseInt(e.target.value)
                          });
                        }
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>

                {/* Room Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Room Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={rooms.find(r => r.id === selectedRoom)?.fill || '#f5f5f5'}
                      onChange={(e) => {
                        const updatedRooms = rooms.map(room => 
                          room.id === selectedRoom 
                            ? { ...room, fill: e.target.value }
                            : room
                        );
                        setRooms(updatedRooms);
                      }}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={rooms.find(r => r.id === selectedRoom)?.fill || '#f5f5f5'}
                      onChange={(e) => {
                        const updatedRooms = rooms.map(room => 
                          room.id === selectedRoom 
                            ? { ...room, fill: e.target.value }
                            : room
                        );
                        setRooms(updatedRooms);
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="#f5f5f5"
                    />
                  </div>
                </div>

                {/* Position Info */}
                <div className="border-t pt-2">
                  <div className="text-xs text-gray-600">
                    Position: ({Math.round((rooms.find(r => r.id === selectedRoom)?.x || 0) / (rooms.find(r => r.id === selectedRoom)?.scale || 1))}, {Math.round((rooms.find(r => r.id === selectedRoom)?.y || 0) / (rooms.find(r => r.id === selectedRoom)?.scale || 1))})
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Free movement enabled - rooms can overlap
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Door/Wall Customization Panel */}
          {(selectedDoor || selectedWall) && !selectedRoom && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm font-medium text-gray-900 mb-3">
                🎨 Customize {selectedDoor ? 'Door' : 'Wall'}
              </div>
              
              {selectedDoor && (
                <div className="space-y-3">
                  {/* Door Color */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Door Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={doors.find(d => d.id === selectedDoor)?.stroke || doorColor}
                        onChange={(e) => customizeDoor('stroke', e.target.value)}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={doors.find(d => d.id === selectedDoor)?.stroke || doorColor}
                        onChange={(e) => customizeDoor('stroke', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                        placeholder="#8B4513"
                      />
                    </div>
                  </div>
                  
                  {/* Door Width */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Door Width: {doors.find(d => d.id === selectedDoor)?.strokeWidth || doorWidth}px
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      value={doors.find(d => d.id === selectedDoor)?.strokeWidth || doorWidth}
                      onChange={(e) => customizeDoor('strokeWidth', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              
              {selectedWall && (
                <div className="space-y-3">
                  {/* Wall Color */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Wall Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={walls.find(w => w.id === selectedWall)?.stroke || wallColor}
                        onChange={(e) => customizeWall('stroke', e.target.value)}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={walls.find(w => w.id === selectedWall)?.stroke || wallColor}
                        onChange={(e) => customizeWall('stroke', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  {/* Wall Width */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Wall Width: {walls.find(w => w.id === selectedWall)?.strokeWidth || wallWidth}px
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={walls.find(w => w.id === selectedWall)?.strokeWidth || wallWidth}
                      onChange={(e) => customizeWall('strokeWidth', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Room Type Distribution Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-900 mb-2">
              🏠 Room Types
            </div>
            <div className="space-y-2">
              {Object.entries(roomTypeDistribution).map(([roomType, percentage]) => (
                <div key={roomType} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium">{roomType}:</span>
                    <span className="text-gray-900">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {getRoomsOfType(roomType).length} room{getRoomsOfType(roomType).length !== 1 ? 's' : ''}
                    {getRoomsOfType(roomType).length > 1 && 
                      ` (${(percentage / getRoomsOfType(roomType).length).toFixed(1)}% each)`
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Room Distribution Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-900 mb-2">
              📊 Individual Rooms
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {/* Total Floor Area */}
              <div className="text-xs text-gray-600 mb-2 border-b pb-1">
                Total: {totalFloorArea.toLocaleString()} sq units
              </div>
              
              {/* Individual Room Percentages */}
              {rooms.map(room => (
                <div key={room.id} className="flex items-center justify-between text-xs">
                  <span className={`truncate flex-1 ${selectedRoom === room.id ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                    {room.name || room.tag}:
                  </span>
                  <span className={`ml-2 ${selectedRoom === room.id ? 'text-blue-600 font-medium' : 'text-gray-900'}`}>
                    {(roomPercentages[room.id] || 0).toFixed(1)}%
                  </span>
                </div>
              ))}
              
              {/* Available Percentage */}
              {availablePercentage > 0 && (
                <div className="flex justify-between text-xs text-green-600 border-t pt-2">
                  <span>Available:</span>
                  <span>{availablePercentage.toFixed(1)}%</span>
                </div>
              )}
              
              {/* Progress Bar */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Object.values(roomPercentages).reduce((sum, p) => sum + p, 0))}%` }}
                  ></div>
                </div>
                <div className="text-xs text-center text-gray-500 mt-1">
                  {Object.values(roomPercentages).reduce((sum, p) => sum + p, 0).toFixed(1)}% allocated
                </div>
              </div>
            </div>
          </div>

          {/* Element Count Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-900 mb-2">
              🏗️ Elements
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Rooms:</span>
                <span>{rooms.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Doors:</span>
                <span>{doors.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Walls:</span>
                <span>{walls.length}</span>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-sm font-medium text-gray-900 mb-2">
              ⚙️ Settings
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="snapToGrid"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="w-3 h-3"
                />
                <label htmlFor="snapToGrid" className="text-xs text-gray-600">
                  Snap to Grid ({gridSize}px)
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Floor Plan Area */}
      <div className="flex-1 relative border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Canvas */}
        <Stage
          width={width}
          height={height}
          ref={stageRef}
          onClick={handleStageClick}
          onMouseMove={handleStageMouseMove}
          className={`cursor-${creationMode ? 'crosshair' : 'default'}`}
        >
        <Layer>
          {/* Grid background */}
          {isEditable && (
            <>
              {/* Vertical grid lines */}
              {Array.from({ length: Math.floor(width / 25) + 1 }, (_, i) => (
                <Line
                  key={`v-grid-${i}`}
                  points={[i * 25, 0, i * 25, height]}
                  stroke="#e0e0e0"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              ))}
              {/* Horizontal grid lines */}
              {Array.from({ length: Math.floor(height / 25) + 1 }, (_, i) => (
                <Line
                  key={`h-grid-${i}`}
                  points={[0, i * 25, width, i * 25]}
                  stroke="#e0e0e0"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              ))}
            </>
          )}

          {/* Plot boundary */}
          <Rect
            x={2}
            y={2}
            width={width - 4}
            height={height - 4}
            fill="transparent"
            stroke="#000"
            strokeWidth={3}
          />

          {/* Walls */}
          {walls.map(wall => (
            <Group key={wall.id}>
              <Line
                points={wall.points}
                stroke={selectedWall === wall.id ? '#2196F3' : wall.stroke}
                strokeWidth={selectedWall === wall.id ? wall.strokeWidth + 2 : wall.strokeWidth}
                lineCap={wall.lineCap}
                draggable={isEditable}
                onDragStart={(e) => handleWallDragStart(e, wall.id)}
                onDragEnd={(e) => handleWallDragEnd(e, wall.id)}
                onClick={(e) => handleWallClick(e, wall.id)}
                style={{ cursor: isEditable ? 'move' : 'default' }}
              />
              {/* Wall selection indicator */}
              {selectedWall === wall.id && isEditable && (
                <>
                  {/* Start point handle */}
                  <Circle
                    x={wall.points[0]}
                    y={wall.points[1]}
                    radius={6}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={2}
                    draggable={true}
                    style={{ cursor: 'pointer' }}
                  />
                  {/* End point handle */}
                  <Circle
                    x={wall.points[2]}
                    y={wall.points[3]}
                    radius={6}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={2}
                    draggable={true}
                    style={{ cursor: 'pointer' }}
                  />
                </>
              )}
            </Group>
          ))}

          {/* Rooms */}
          {rooms.map(room => (
            <Group key={room.id}>
              {/* Room rectangle */}
              <Rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill={room.fill}
                stroke={selectedRoom === room.id ? '#2196F3' : room.stroke}
                strokeWidth={selectedRoom === room.id ? 3 : room.strokeWidth}
                draggable={room.draggable}
                onDragStart={(e) => handleRoomDragStart(e, room.id)}
                onDragMove={(e) => handleRoomDragMove(e, room.id)}
                onDragEnd={(e) => handleRoomDragEnd(e, room.id)}
                onClick={(e) => handleRoomClick(e, room.id)}
                style={{ cursor: isEditable ? 'move' : 'default' }}
                shadowBlur={selectedRoom === room.id ? 10 : 0}
                shadowColor="rgba(33, 150, 243, 0.5)"
              />

              {/* Room label */}
              <Text
                x={room.x + room.width / 2}
                y={room.y + room.height / 2 - 10}
                text={room.name}
                fontSize={Math.min(16, Math.max(10, Math.min(room.width, room.height) / 8))}
                fontFamily="Arial"
                fontStyle="bold"
                fill="#333"
                align="center"
                verticalAlign="middle"
                width={room.width}
                listening={false}
              />

              {/* Room dimensions */}
              <Text
                x={room.x + room.width / 2}
                y={room.y + room.height / 2 + 10}
                text={`${Math.round(room.width)}×${Math.round(room.height)}`}
                fontSize={Math.min(12, Math.max(8, Math.min(room.width, room.height) / 12))}
                fontFamily="Arial"
                fill="#666"
                align="center"
                verticalAlign="middle"
                width={room.width}
                listening={false}
              />

              {/* Resize handles for selected room */}
              {selectedRoom === room.id && isEditable && (
                <>
                  {/* Bottom-right corner handle */}
                  <Rect
                    x={room.x + room.width - 4}
                    y={room.y + room.height - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    draggable={true}
                    onDragMove={(e) => {
                      const newWidth = e.target.x() - room.x + 4;
                      const newHeight = e.target.y() - room.y + 4;
                      handleResize(room.id, newWidth, newHeight);
                    }}
                    style={{ cursor: 'nw-resize' }}
                  />
                  
                  {/* Right edge handle */}
                  <Rect
                    x={room.x + room.width - 4}
                    y={room.y + room.height / 2 - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    draggable={true}
                    onDragMove={(e) => {
                      const newWidth = e.target.x() - room.x + 4;
                      handleResize(room.id, newWidth, room.height);
                    }}
                    style={{ cursor: 'ew-resize' }}
                  />
                  
                  {/* Bottom edge handle */}
                  <Rect
                    x={room.x + room.width / 2 - 4}
                    y={room.y + room.height - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    draggable={true}
                    onDragMove={(e) => {
                      const newHeight = e.target.y() - room.y + 4;
                      handleResize(room.id, room.width, newHeight);
                    }}
                    style={{ cursor: 'ns-resize' }}
                  />
                </>
              )}
            </Group>
          ))}

          {/* Doors - render on top */}
          {doors.map(door => {
            const x1 = door.points[0];
            const y1 = door.points[1];
            const x2 = door.points[2];
            const y2 = door.points[3];
            
            const isSelected = selectedDoor === door.id;
            
            return (
              <Group key={door.id}>
                {/* Simple door - bold brown line */}
                <Line
                  points={[x1, y1, x2, y2]}
                  stroke={isSelected ? "#2196F3" : "#8B4513"}
                  strokeWidth={Math.max(8, door.strokeWidth * 2)}
                  lineCap="round"
                  draggable={isEditable}
                  onDragStart={(e) => handleDoorDragStart(e, door.id)}
                  onDragMove={(e) => handleDoorDragMove(e, door.id)}
                  onDragEnd={(e) => handleDoorDragEnd(e, door.id)}
                  onClick={(e) => handleDoorClick(e, door.id)}
                  style={{ cursor: isEditable ? 'move' : 'default' }}
                />
                
                {/* Door selection indicators */}
                {isSelected && isEditable && (
                  <>
                    {/* Start point handle */}
                    <Circle
                      x={x1}
                      y={y1}
                      radius={6}
                      fill="#2196F3"
                      stroke="#1976D2"
                      strokeWidth={2}
                      draggable={true}
                      style={{ cursor: 'move' }}
                    />
                    {/* End point handle */}
                    <Circle
                      x={x2}
                      y={y2}
                      radius={6}
                      fill="#2196F3"
                      stroke="#1976D2"
                      strokeWidth={2}
                      draggable={true}
                      style={{ cursor: 'move' }}
                    />
                  </>
                )}
              </Group>
            );
          })}

          {/* Creation preview */}
          {isCreating && newElementStart && (
            <>
              {creationMode === 'room' ? (
                <Rect
                  x={Math.min(newElementStart.x, stageRef.current?.getPointerPosition()?.x || newElementStart.x)}
                  y={Math.min(newElementStart.y, stageRef.current?.getPointerPosition()?.y || newElementStart.y)}
                  width={Math.abs((stageRef.current?.getPointerPosition()?.x || newElementStart.x) - newElementStart.x)}
                  height={Math.abs((stageRef.current?.getPointerPosition()?.y || newElementStart.y) - newElementStart.y)}
                  fill="rgba(227, 242, 253, 0.5)"
                  stroke="#2196F3"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
              ) : (
                <Line
                  points={[
                    newElementStart.x, 
                    newElementStart.y, 
                    stageRef.current?.getPointerPosition()?.x || newElementStart.x,
                    stageRef.current?.getPointerPosition()?.y || newElementStart.y
                  ]}
                  stroke={creationMode === 'door' ? '#4CAF50' : creationMode === 'wall' ? '#2196F3' : '#9C27B0'}
                  strokeWidth={creationMode === 'door' ? 6 : 4}
                  lineCap="round"
                  dash={[5, 5]}
                  opacity={0.7}
                />
              )}
            </>
          )}
        </Layer>
      </Stage>

      {/* Selection Info - moved to bottom right of floor plan area */}
      {(selectedRoom || selectedDoor || selectedWall) && (
        <div className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg max-w-xs">
          {selectedRoom && (
            <>
              <div className="text-sm font-medium text-gray-900 flex items-center">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
                Room: {rooms.find(r => r.id === selectedRoom)?.name || selectedRoom}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Position: ({Math.round(rooms.find(r => r.id === selectedRoom)?.x || 0)}, {Math.round(rooms.find(r => r.id === selectedRoom)?.y || 0)})
              </div>
              <div className="text-xs text-gray-600">
                Size: {Math.round(rooms.find(r => r.id === selectedRoom)?.width || 0)}×{Math.round(rooms.find(r => r.id === selectedRoom)?.height || 0)}
              </div>
            </>
          )}
          
          {selectedDoor && (
            <>
              <div className="text-sm font-medium text-gray-900 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3" />
                </svg>
                Door: {selectedDoor}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Start: ({Math.round(doors.find(d => d.id === selectedDoor)?.points[0] || 0)}, {Math.round(doors.find(d => d.id === selectedDoor)?.points[1] || 0)})
              </div>
              <div className="text-xs text-gray-600">
                End: ({Math.round(doors.find(d => d.id === selectedDoor)?.points[2] || 0)}, {Math.round(doors.find(d => d.id === selectedDoor)?.points[3] || 0)})
              </div>
            </>
          )}
          
          {selectedWall && (
            <>
              <div className="text-sm font-medium text-gray-900 flex items-center">
                <div className="w-4 h-1 bg-gray-600 mr-2"></div>
                Wall: {selectedWall}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Start: ({Math.round(walls.find(w => w.id === selectedWall)?.points[0] || 0)}, {Math.round(walls.find(w => w.id === selectedWall)?.points[1] || 0)})
              </div>
              <div className="text-xs text-gray-600">
                End: ({Math.round(walls.find(w => w.id === selectedWall)?.points[2] || 0)}, {Math.round(walls.find(w => w.id === selectedWall)?.points[3] || 0)})
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </div>
  );
};

export default KonvaFloorPlan;