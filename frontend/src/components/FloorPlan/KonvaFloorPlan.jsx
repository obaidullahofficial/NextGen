import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Line, Group, Arc, Circle } from 'react-konva';

const KonvaFloorPlan = forwardRef(({ 
  floorPlanData, 
  width = 800, 
  height = 600, 
  onRoomUpdate,
  onRoomsChange,
  onWallsChange,
  onDoorsChange,
  onWindowsChange,
  onStairsChange,
  isEditable = false,
  showWalls = true,
  showAllocatedArea = true,
  setbacks = null  // { front, rear, left, right } in feet — optional
}, ref) => {
  const [rooms, setRooms] = useState([]);
  const [walls, setWalls] = useState([]);
  const [doors, setDoors] = useState([]);
  const [windows, setWindows] = useState([]);
  const [stairs, setStairs] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDoor, setSelectedDoor] = useState(null);
  const [selectedWall, setSelectedWall] = useState(null);
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [selectedStairs, setSelectedStairs] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'room', 'door', 'wall'
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState(25);
  const [creationMode, setCreationMode] = useState(null); // 'door', 'wall', 'window', null
  const [isCreating, setIsCreating] = useState(false);
  const [newElementStart, setNewElementStart] = useState(null);
  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);
  const [doorColor, setDoorColor] = useState('#8B4513');
  const [wallColor, setWallColor] = useState('#000000');
  const [windowColor, setWindowColor] = useState('#87CEEB');
  const [doorWidth, setDoorWidth] = useState(6);
  const [wallWidth, setWallWidth] = useState(4);
  const [windowWidth, setWindowWidth] = useState(5);
  const [totalFloorArea, setTotalFloorArea] = useState(10000); // Total area in square units
  const [roomPercentages, setRoomPercentages] = useState({}); // Room ID -> percentage mapping
  const [availablePercentage, setAvailablePercentage] = useState(100);
  const [roomTypeDistribution, setRoomTypeDistribution] = useState({}); // Room type -> total percentage
  const stageRef = useRef();
  const [resizingRoom, setResizingRoom] = useState(null); // Track which room is being resized
  const [resizingStairs, setResizingStairs] = useState(null); // Track which stairs is being resized
  const [resizeHandle, setResizeHandle] = useState(null); // Track which handle is being used
  const resizeThrottleRef = useRef(null); // Throttle resize updates
  const isUserInteracting = useRef(false); // Flag to prevent updates during user interaction
  const doorsUpdatedByUserRef = useRef(false); // Flag to skip door re-processing after user drag
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: null, id: null });
  const [boundaryWarning, setBoundaryWarning] = useState(false);
  const boundaryWarningTimeoutRef = useRef(null);
  const [collisionWarning, setCollisionWarning] = useState(false);
  const collisionWarningTimeoutRef = useRef(null);
  const [showRoomTypeDialog, setShowRoomTypeDialog] = useState(false);
  
  // Room types matching the generation form
  const roomTypes = [
    { key: 'livingroom', label: 'Living Room', icon: '🛋️' },
    { key: 'kitchen', label: 'Kitchen', icon: '🍴' },
    { key: 'bedroom', label: 'Bedroom', icon: '🛏️' },
    { key: 'bathroom', label: 'Bathroom', icon: '🚿' },
    { key: 'carporch', label: 'Car Porch', icon: '🚗' },
    { key: 'garden', label: 'Garden', icon: '🌳' },
    { key: 'drawingroom', label: 'Drawing Room', icon: '🛋️' }
  ];

  // Calculate centered layout - useMemo for performance
  const layoutProps = useMemo(() => {
    const minMargin = 40;
    const plotWidth = floorPlanData?.plotWidth || 1000;
    const plotHeight = floorPlanData?.plotHeight || 1000;
    // Actual dimensions in feet for display purposes
    const actualLength = floorPlanData?.actualLength || 55;
    const actualWidth = floorPlanData?.actualWidth || 25;
    
    console.log('📐 layoutProps calculation:', { plotWidth, plotHeight, actualLength, actualWidth, canvasWidth: width, canvasHeight: height });
    
    // Available canvas area after margins
    const availableWidth = width - minMargin * 2;
    const availableHeight = height - minMargin * 2;
    
    // Fit actual plot dimensions (feet) into available canvas area, maintaining real aspect ratio
    // actualLength = horizontal (x-axis), actualWidth = vertical (y-axis)
    const scaleToFit = Math.min(availableWidth / actualLength, availableHeight / actualWidth);
    
    // Pixel dimensions of the plot preview — proportional to real feet
    const scaledWidth = actualLength * scaleToFit;
    const scaledHeight = actualWidth * scaleToFit;
    
    // Coordinate-to-pixel scale factors (different for x and y axes)
    // Converts 0-1000 backend coordinates to proportionally correct pixels
    const coordScaleX = scaledWidth / plotWidth;
    const coordScaleY = scaledHeight / plotHeight;
    
    console.log('📐 Calculated scales:', { coordScaleX, coordScaleY, scaledWidth, scaledHeight });
    
    // General scale factor for stroke widths and other non-directional sizes
    const scale = Math.min(coordScaleX, coordScaleY);
    
    // Center offsets
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    
    return {
      offsetX,
      offsetY,
      scale,
      coordScaleX,
      coordScaleY,
      scaledWidth,
      scaledHeight,
      plotWidth,
      plotHeight,
      actualLength,
      actualWidth,
      scaleToFit
    };
  }, [width, height, floorPlanData?.plotWidth, floorPlanData?.plotHeight, floorPlanData?.actualLength, floorPlanData?.actualWidth]);

  // Update total floor area based on actual plot dimensions
  useEffect(() => {
    const actualLength = floorPlanData?.actualLength || 55;
    const actualWidth = floorPlanData?.actualWidth || 25;
    const realTotalArea = actualLength * actualWidth;
    setTotalFloorArea(realTotalArea);
  }, [floorPlanData?.actualLength, floorPlanData?.actualWidth]);

  // Helper function to check and constrain room within allocated area
  const constrainRoomToBoundary = useCallback((x, y, roomWidth, roomHeight, showWarning = true) => {
    const { offsetX, offsetY, scaledWidth, scaledHeight } = layoutProps;
    
    // Calculate allocated area bounds using centered offsets
    const allocatedMinX = offsetX;
    const allocatedMinY = offsetY;
    const allocatedMaxX = offsetX + scaledWidth;
    const allocatedMaxY = offsetY + scaledHeight;
    
    let constrainedX = x;
    let constrainedY = y;
    let wasConstrained = false;
    
    // Constrain X position
    if (x < allocatedMinX) {
      constrainedX = allocatedMinX;
      wasConstrained = true;
    } else if (x + roomWidth > allocatedMaxX) {
      constrainedX = allocatedMaxX - roomWidth;
      wasConstrained = true;
    }
    
    // Constrain Y position
    if (y < allocatedMinY) {
      constrainedY = allocatedMinY;
      wasConstrained = true;
    } else if (y + roomHeight > allocatedMaxY) {
      constrainedY = allocatedMaxY - roomHeight;
      wasConstrained = true;
    }
    
    // Show warning if room was constrained
    if (wasConstrained && showWarning && isEditable) {
      setBoundaryWarning(true);
      
      // Clear existing timeout
      if (boundaryWarningTimeoutRef.current) {
        clearTimeout(boundaryWarningTimeoutRef.current);
      }
      
      // Hide warning after 2 seconds
      boundaryWarningTimeoutRef.current = setTimeout(() => {
        setBoundaryWarning(false);
      }, 2000);
    }
    
    return { x: constrainedX, y: constrainedY, wasConstrained };
  }, [layoutProps, isEditable]);

  // Helper function to check if two rooms overlap
  const checkRoomOverlap = useCallback((x1, y1, w1, h1, x2, y2, w2, h2) => {
    // Add small buffer (2px) to prevent touching rooms from being flagged as overlapping
    const buffer = 2;
    return !(
      x1 + w1 - buffer < x2 + buffer ||
      x2 + w2 - buffer < x1 + buffer ||
      y1 + h1 - buffer < y2 + buffer ||
      y2 + h2 - buffer < y1 + buffer
    );
  }, []);

  // Helper function to constrain room to avoid collision with other rooms
  // Auto-adjusts position so room borders are in contact without overlapping
  const constrainRoomToAvoidCollision = useCallback((currentRoomId, x, y, roomWidth, roomHeight, prevX, prevY, prevWidth, prevHeight, showWarning = true) => {
    let adjustedX = x;
    let adjustedY = y;
    let hasCollision = false;
    const gap = 0; // No gap - borders touch perfectly
    const maxIterations = 10; // Prevent infinite loops
    let iteration = 0;

    // Keep adjusting until no overlaps exist (or max iterations reached)
    while (iteration < maxIterations) {
      let foundCollision = false;
      iteration++;

      // Check collision with all other rooms
      for (const room of rooms) {
        if (room.id === currentRoomId) continue;

        // Check if there's overlap
        const overlapX = Math.min(adjustedX + roomWidth, room.x + room.width) - Math.max(adjustedX, room.x);
        const overlapY = Math.min(adjustedY + roomHeight, room.y + room.height) - Math.max(adjustedY, room.y);

        // If both overlaps are positive, rooms are colliding
        if (overlapX > 0 && overlapY > 0) {
          foundCollision = true;
          hasCollision = true;

          // Calculate center points to determine push direction
          const currentCenterX = adjustedX + roomWidth / 2;
          const currentCenterY = adjustedY + roomHeight / 2;
          const otherCenterX = room.x + room.width / 2;
          const otherCenterY = room.y + room.height / 2;

          // Determine which direction has less overlap - push in that direction
          if (overlapX < overlapY) {
            // Push horizontally - borders touch perfectly
            if (currentCenterX < otherCenterX) {
              // Current room is on the left, push it left so right border touches other's left border
              adjustedX = room.x - roomWidth - gap;
            } else {
              // Current room is on the right, push it right so left border touches other's right border
              adjustedX = room.x + room.width + gap;
            }
          } else {
            // Push vertically - borders touch perfectly
            if (currentCenterY < otherCenterY) {
              // Current room is above, push it up so bottom border touches other's top border
              adjustedY = room.y - roomHeight - gap;
            } else {
              // Current room is below, push it down so top border touches other's bottom border
              adjustedY = room.y + room.height + gap;
            }
          }
          
          // Break and re-check all rooms with new position
          break;
        }
      }

      // If no collision found in this iteration, we're done
      if (!foundCollision) {
        break;
      }
    }

    // Show warning if collision was detected and adjusted
    if (hasCollision && showWarning && isEditable) {
      setCollisionWarning(true);
      
      // Clear existing timeout
      if (collisionWarningTimeoutRef.current) {
        clearTimeout(collisionWarningTimeoutRef.current);
      }
      
      // Hide warning after 2 seconds
      collisionWarningTimeoutRef.current = setTimeout(() => {
        setCollisionWarning(false);
      }, 2000);
    }

    // Return adjusted position (borders touching perfectly if collision was detected)
    return { x: adjustedX, y: adjustedY, width: roomWidth, height: roomHeight, hasCollision };
  }, [rooms, isEditable]);

  useImperativeHandle(ref, () => stageRef.current);
  
  // Cleanup warning timeouts on unmount
  useEffect(() => {
    return () => {
      if (boundaryWarningTimeoutRef.current) {
        clearTimeout(boundaryWarningTimeoutRef.current);
      }
      if (collisionWarningTimeoutRef.current) {
        clearTimeout(collisionWarningTimeoutRef.current);
      }
    };
  }, []);

  // Snap to grid helper function
  const snapToGridCoordinate = useCallback((value) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // Handle context menu for delete
  const handleContextMenu = useCallback((e, type, id) => {
    if (!isEditable) return;
    e.evt.preventDefault();
    setContextMenu({
      visible: true,
      x: e.evt.clientX,
      y: e.evt.clientY,
      type,
      id
    });
  }, [isEditable]);

  // Handle delete from context menu
  const handleDeleteFromContextMenu = useCallback(() => {
    if (!contextMenu.visible) return;
    
    const { type, id } = contextMenu;
    
    if (type === 'room') {
      const updatedRooms = rooms.filter(r => r.id !== id);
      const updatedPercentages = { ...roomPercentages };
      delete updatedPercentages[id];
      
      setRooms(updatedRooms);
      setRoomPercentages(updatedPercentages);
      
      if (onRoomsChange) {
        onRoomsChange(updatedRooms);
      }
      setSelectedRoom(null);
    } else if (type === 'door') {
      const updatedDoors = doors.filter(d => d.id !== id);
      setDoors(updatedDoors);
      if (onDoorsChange) {
        onDoorsChange(updatedDoors);
      }
      setSelectedDoor(null);
    } else if (type === 'wall') {
      const updatedWalls = walls.filter(w => w.id !== id);
      setWalls(updatedWalls);
      if (onWallsChange) {
        onWallsChange(updatedWalls);
      }
      setSelectedWall(null);
    } else if (type === 'window') {
      const updatedWindows = windows.filter(w => w.id !== id);
      setWindows(updatedWindows);
      if (onWindowsChange) {
        onWindowsChange(updatedWindows);
      }
      setSelectedWindow(null);
    } else if (type === 'stairs') {
      const updatedStairs = stairs.filter(s => s.id !== id);
      setStairs(updatedStairs);
      if (onStairsChange) {
        onStairsChange(updatedStairs);
      }
      setSelectedStairs(null);
    }
    
    setContextMenu({ visible: false, x: 0, y: 0, type: null, id: null });
  }, [contextMenu, doors, walls, windows, rooms, stairs, roomPercentages, onDoorsChange, onWallsChange, onWindowsChange, onRoomsChange]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, type: null, id: null });
      }
    };
    
    if (contextMenu.visible) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible]);

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
          // Notify parent about door deletion
          if (onDoorsChange) {
            onDoorsChange(updatedDoors);
          }
          setSelectedDoor(null);
        } else if (selectedWall) {
          const updatedWalls = walls.filter(w => w.id !== selectedWall);
          setWalls(updatedWalls);
          setSelectedWall(null);
        } else if (selectedWindow) {
          const updatedWindows = windows.filter(w => w.id !== selectedWindow);
          setWindows(updatedWindows);
          // Notify parent about window deletion
          if (onWindowsChange) {
            onWindowsChange(updatedWindows);
          }
          setSelectedWindow(null);
        } else if (selectedStairs) {
          const updatedStairs = stairs.filter(s => s.id !== selectedStairs);
          setStairs(updatedStairs);
          if (onStairsChange) {
            onStairsChange(updatedStairs);
          }
          setSelectedStairs(null);
        }
      }
      
      // Deselect all with Escape
      if (e.key === 'Escape') {
        setSelectedRoom(null);
        setSelectedDoor(null);
        setSelectedWall(null);
        setSelectedWindow(null);
        setSelectedStairs(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditable, selectedRoom, selectedDoor, selectedWall, selectedWindow, selectedStairs, rooms, doors, walls, windows, stairs]);

  // Convert backend data to Konva-friendly format
  useEffect(() => {
    // Don't update rooms while user is actively interacting
    if (isUserInteracting.current) {
      return;
    }
    
    if (floorPlanData) {
      // Use centered layout props with separate x/y coordinate scales
      const { offsetX, offsetY, scale, coordScaleX, coordScaleY } = layoutProps;
      
      console.log('🔧 KonvaFloorPlan: Converting backend data to Konva coordinates');
      console.log('   Layout props:', { offsetX, offsetY, coordScaleX, coordScaleY });
      
      // Convert rooms data with proportional scaling (different for x and y)
      const roomsData = (floorPlanData.rooms || []).map((room, index) => {
        const konvaRoom = {
          id: room.id || `room-${index}`,
          x: (room.x || 0) * coordScaleX + offsetX,
          y: (room.y || 0) * coordScaleY + offsetY,
          width: (room.width || 100) * coordScaleX,
          height: (room.height || 100) * coordScaleY,
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
          coordScaleX: coordScaleX,
          coordScaleY: coordScaleY,
          scale: scale
        };
        
        if (index === 0) {
          console.log(`   Sample room conversion:`, {
            backend: { x: room.x, y: room.y, width: room.width, height: room.height },
            konva: { x: konvaRoom.x, y: konvaRoom.y, width: konvaRoom.width, height: konvaRoom.height }
          });
        }
        
        return konvaRoom;
      });

      // Convert walls data with proportional scaling
      const wallsData = (floorPlanData.mapData || [])
        .filter(item => item.type === 'Wall')
        .map((wall, index) => ({
          id: wall.id || `wall-${index}`,
          points: [
            (wall.x1 || 0) * coordScaleX + offsetX, 
            (wall.y1 || 0) * coordScaleY + offsetY, 
            (wall.x2 || 0) * coordScaleX + offsetX, 
            (wall.y2 || 0) * coordScaleY + offsetY
          ],
          stroke: '#000000',
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
            id: door.id || `door-${index}`,
            points: [
              (door.x1 || 0) * coordScaleX + offsetX, 
              (door.y1 || 0) * coordScaleY + offsetY, 
              (door.x2 || 0) * coordScaleX + offsetX, 
              (door.y2 || 0) * coordScaleY + offsetY
            ],
            stroke: '#8B4513',
            strokeWidth: Math.max(6, 4 * scale),
            lineCap: 'round',
            type: 'Door'
          }));
        doorsData = [...doorsData, ...mapDoors];
      }
      
      // Method 2: Check direct doors array
      if (floorPlanData.doors && Array.isArray(floorPlanData.doors)) {
        const directDoors = floorPlanData.doors.map((door, index) => ({
          id: door.id || `direct-door-${index}`,
          points: [
            (door.x1 || 0) * coordScaleX + offsetX, 
            (door.y1 || 0) * coordScaleY + offsetY, 
            (door.x2 || 0) * coordScaleX + offsetX, 
            (door.y2 || 0) * coordScaleY + offsetY
          ],
          stroke: '#8B4513',
          strokeWidth: Math.max(6, 4 * scale),
          lineCap: 'round',
          type: 'Door'
        }));
        doorsData = [...doorsData, ...directDoors];
      }
      
      // Method 3: Auto-generate doors on room walls if no doors found
      if (doorsData.length === 0 && roomsData.length > 0) {
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
      }

      const finalDoorsData = doorsData;
      
      // Convert windows data with proper scaling
      let windowsData = [];
      
      // Check mapData for windows
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData)) {
        const mapWindows = floorPlanData.mapData
          .filter(item => item.type === 'Window')
          .map((window, index) => ({
            id: window.id || `window-${index}`,
            points: [
              (window.x1 || 0) * coordScaleX + offsetX, 
              (window.y1 || 0) * coordScaleY + offsetY, 
              (window.x2 || 0) * coordScaleX + offsetX, 
              (window.y2 || 0) * coordScaleY + offsetY
            ],
            stroke: '#87CEEB',
            strokeWidth: Math.max(5, 3 * scale),
            lineCap: 'round'
          }));
        windowsData = [...windowsData, ...mapWindows];
      }
      
      // Check direct windows array
      if (floorPlanData.windows && Array.isArray(floorPlanData.windows)) {
        const directWindows = floorPlanData.windows.map((window, index) => ({
          id: window.id || `direct-window-${index}`,
          points: [
            (window.x1 || 0) * coordScaleX + offsetX, 
            (window.y1 || 0) * coordScaleY + offsetY, 
            (window.x2 || 0) * coordScaleX + offsetX, 
            (window.y2 || 0) * coordScaleY + offsetY
          ],
          stroke: '#87CEEB',
          strokeWidth: Math.max(5, 3 * scale),
          lineCap: 'round'
        }));
        windowsData = [...windowsData, ...directWindows];
      }

      const finalWindowsData = windowsData;
      
      // Merge with existing manually created rooms (those not from floorPlanData)
      setRooms(prevRooms => {
        // Find manually created rooms (IDs starting with 'new-room-' or 'created-room-')
        const manualRooms = prevRooms.filter(room => 
          room.id && (room.id.toString().startsWith('new-room-') || room.id.toString().startsWith('created-room-'))
        );
        
        // Create a set of manual room IDs to avoid duplicates
        const manualRoomIds = new Set(manualRooms.map(r => r.id));
        
        // Remove any rooms from roomsData that have IDs matching manual rooms (to avoid duplicates)
        const floorPlanOnlyRooms = roomsData.filter(room =>
          !room.id || !manualRoomIds.has(room.id)
        );
        
        // Combine: rooms from floorPlanData (excluding manual ones) + manual rooms
        return [...floorPlanOnlyRooms, ...manualRooms];
      });
      
      // Merge with existing manually created walls (those not from floorPlanData)
      setWalls(prevWalls => {
        // Find manually created walls (IDs starting with 'new-wall-')
        const manualWalls = prevWalls.filter(wall => 
          wall.id && wall.id.toString().startsWith('new-wall-')
        );
        
        // Get manual wall IDs for deduplication
        const manualWallIds = new Set(manualWalls.map(w => w.id));
        
        // Filter out walls from wallsData that are already in manual walls
        const nonManualWallsData = wallsData.filter(wall => !manualWallIds.has(wall.id));
        
        // Combine: add/update walls from floorPlanData (excluding duplicates) + keep manual walls
        return [...nonManualWallsData, ...manualWalls];
      });
      
      // Merge with existing manually created doors (those not from floorPlanData)
      // Skip re-processing if doors were just updated by user drag to avoid overwriting positions
      if (doorsUpdatedByUserRef.current) {
        doorsUpdatedByUserRef.current = false;
      } else {
        setDoors(prevDoors => {
          // Find manually created doors (IDs starting with 'new-door-' or 'created-door-')
          const manualDoors = prevDoors.filter(door => 
            door.id && (door.id.toString().startsWith('new-door-') || door.id.toString().startsWith('created-door-'))
          );
          
          // Create a set of manual door IDs to avoid duplicates
          const manualDoorIds = new Set(manualDoors.map(d => d.id));
          
          // Remove any doors from finalDoorsData that have IDs matching manual doors (to avoid duplicates)
          const floorPlanOnlyDoors = finalDoorsData.filter(door =>
            !door.id || !manualDoorIds.has(door.id)
          );
          
          // Combine: doors from floorPlanData (excluding manual ones) + manual doors
          return [...floorPlanOnlyDoors, ...manualDoors];
        });
      }
      
      // Merge with existing manually created windows (those not from floorPlanData)
      setWindows(prevWindows => {
        // Find manually created windows (IDs starting with 'new-window-')
        const manualWindows = prevWindows.filter(window => 
          window.id && window.id.toString().startsWith('new-window-')
        );
        
        // Remove any windows from finalWindowsData that have IDs matching manual windows (to avoid duplicates)
        const floorPlanOnlyWindows = finalWindowsData.filter(window =>
          !window.id || !window.id.toString().startsWith('new-window-')
        );
        
        // Combine: windows from floorPlanData (excluding manual ones) + manual windows
        return [...floorPlanOnlyWindows, ...manualWindows];
      });

      // Convert stairs data with proper scaling
      let stairsData = [];
      
      console.log('🪜 KonvaFloorPlan: Loading stairs from backend data');
      
      // Check mapData for stairs
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData)) {
        const mapStairs = floorPlanData.mapData
          .filter(item => item.type === 'Stairs' || item.type === 'stairs')
          .map((stair, index) => {
            const konvaStair = {
              id: stair.id || `stairs-${index}`,
              x: (stair.x || 0) * coordScaleX + offsetX,
              y: (stair.y || 0) * coordScaleY + offsetY,
              width: (stair.width || 80) * coordScaleX,
              height: (stair.height || 120) * coordScaleY,
              direction: stair.direction || 'up'
            };
            
            console.log(`   Stairs ${stair.id}:`, {
              backend: { x: stair.x, y: stair.y, width: stair.width, height: stair.height },
              konva: { x: konvaStair.x, y: konvaStair.y, width: konvaStair.width, height: konvaStair.height }
            });
            
            return konvaStair;
          });
        stairsData = [...stairsData, ...mapStairs];
        console.log(`   Found ${mapStairs.length} stairs in mapData`);
      }
      
      // Check direct stairs array (for backward compatibility)
      if (floorPlanData.stairs && Array.isArray(floorPlanData.stairs)) {
        const directStairs = floorPlanData.stairs.map((stair, index) => ({
          id: stair.id || `direct-stairs-${index}`,
          x: (stair.x || 0) * coordScaleX + offsetX,
          y: (stair.y || 0) * coordScaleY + offsetY,
          width: (stair.width || 80) * coordScaleX,
          height: (stair.height || 120) * coordScaleY,
          direction: stair.direction || 'up'
        }));
        stairsData = [...stairsData, ...directStairs];
        console.log(`   Found ${directStairs.length} stairs in direct stairs array`);
      }

      // Set stairs directly - no merging needed since floorPlanData is the source of truth
      console.log(`   Total stairs loaded: ${stairsData.length}`);
      setStairs(stairsData);
    }
  }, [floorPlanData, isEditable, layoutProps]);

  // Get room color based on type - matching the Room Color Guide
  const getRoomColor = (roomType) => {
    const colors = {
      'livingroom': '#FFE4E9',    // Lighter Pink - Living
      'bedroom': '#E8F8E8',       // Lighter Green - Bedroom
      'kitchen': '#FFF9C4',       // Lighter Yellow - Kitchen
      'bathroom': '#E3F2FD',      // Lighter Blue - Bathroom
      'drawingroom': '#FFF0E0',   // Lighter Peach - Drawing
      'carporch': '#F3F0FF',      // Lighter Lavender - Car Porch
      'garden': '#E8F0F8'         // Lighter Steel Blue - Garden
    };
    
    if (!roomType) return '#F0F0F0';
    const type = roomType.split('-')[0].toLowerCase();
    return colors[type] || '#F0F0F0';
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
    
    isUserInteracting.current = true; // Set flag to prevent updates
    
    const room = rooms.find(r => r.id === roomId);
    // Store previous position and dimensions for collision revert
    setDragStart({ x: room.x, y: room.y, width: room.width, height: room.height });
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
    
    isUserInteracting.current = true;
    
    // Store the initial drag position for calculating offset later
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
    
    setRooms(prevRooms => {
      const room = prevRooms.find(r => r.id === roomId);
      
      if (!room) return prevRooms;
      
      const { offsetX, offsetY } = layoutProps;
      const coordScaleX = room.coordScaleX || room.scale || 1;
      const coordScaleY = room.coordScaleY || room.scale || 1;
      
      // Apply snap to grid but allow free movement (no boundary constraints for overlapping)
      const snappedX = snapToGridCoordinate(newX);
      const snappedY = snapToGridCoordinate(newY);

      // Convert back to original coordinates for backend (using per-axis scales)
      const originalX = (snappedX - offsetX) / coordScaleX;
      const originalY = (snappedY - offsetY) / coordScaleY;

      // Send update to parent component with original coordinates (in setTimeout to avoid render issues)
      if (onRoomUpdate) {
        setTimeout(() => {
          onRoomUpdate(roomId, {
            x: originalX,
            y: originalY,
            width: room.originalWidth || room.width / coordScaleX,
            height: room.originalHeight || room.height / coordScaleY
          });
        }, 0);
      }

      // Get previous position from dragStart (stored in handleRoomDragStart)
      const prevX = dragStart.x || snappedX;
      const prevY = dragStart.y || snappedY;
      const prevWidth = dragStart.width || room.width;
      const prevHeight = dragStart.height || room.height;

      // Check collision with other rooms first (auto-adjusts to touch borders)
      const collisionResult = constrainRoomToAvoidCollision(
        roomId, snappedX, snappedY, room.width, room.height,
        prevX, prevY, prevWidth, prevHeight
      );
      let finalX = collisionResult.x;
      let finalY = collisionResult.y;

      // Then apply boundary constraints (always apply after collision adjustment)
      const boundaryConstrained = constrainRoomToBoundary(finalX, finalY, room.width, room.height, true);
      finalX = boundaryConstrained.x;
      finalY = boundaryConstrained.y;
      
      // Update the Konva element position immediately to prevent visual mismatch
      e.target.position({ x: finalX, y: finalY });
      
      return prevRooms.map(r => 
        r.id === roomId 
          ? { ...r, x: finalX, y: finalY, originalX, originalY, coordScaleX, coordScaleY }
          : r
      );
    });
    
    setIsDragging(false);
    setDragType(null);
    isUserInteracting.current = false; // Clear flag after drag ends
  }, [isEditable, onRoomUpdate, snapToGridCoordinate, constrainRoomToAvoidCollision, constrainRoomToBoundary, dragStart, layoutProps]);

  // Handle room drag move for visual feedback
  const handleRoomDragMove = useCallback((e, roomId) => {
    if (!isEditable || !isDragging) return;
    
    // Get current position
    const currentX = e.target.x();
    const currentY = e.target.y();
    
    // Apply snap to grid
    const snappedX = snapToGridCoordinate(currentX);
    const snappedY = snapToGridCoordinate(currentY);
    
    // Get room dimensions
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Get previous position from dragStart
    const prevX = dragStart.x || snappedX;
    const prevY = dragStart.y || snappedY;
    const prevWidth = dragStart.width || room.width;
    const prevHeight = dragStart.height || room.height;
    
    // Apply collision detection in real-time (no warning during drag)
    const collisionResult = constrainRoomToAvoidCollision(
      roomId, snappedX, snappedY, room.width, room.height,
      prevX, prevY, prevWidth, prevHeight, false // Don't show warning during drag
    );
    let finalX = collisionResult.x;
    let finalY = collisionResult.y;
    
    // Apply boundary constraints
    const boundaryConstrained = constrainRoomToBoundary(finalX, finalY, room.width, room.height, false);
    finalX = boundaryConstrained.x;
    finalY = boundaryConstrained.y;
    
    // Update target position to constrained coordinates
    e.target.position({ x: finalX, y: finalY });
  }, [isEditable, isDragging, snapToGridCoordinate, rooms, dragStart, constrainRoomToAvoidCollision, constrainRoomToBoundary]);

  // Helper function to find the nearest wall edge for door placement
  const findNearestWallEdge = useCallback((x, y, doorLength) => {
    let nearestWall = null;
    let minDistance = Infinity;
    let snapPosition = null;
    
    // Check room boundaries
    rooms.forEach(room => {
      const roomWalls = [
        // Top wall
        { x1: room.x, y1: room.y, x2: room.x + room.width, y2: room.y, edge: 'top', type: 'room' },
        // Right wall  
        { x1: room.x + room.width, y1: room.y, x2: room.x + room.width, y2: room.y + room.height, edge: 'right', type: 'room' },
        // Bottom wall
        { x1: room.x, y1: room.y + room.height, x2: room.x + room.width, y2: room.y + room.height, edge: 'bottom', type: 'room' },
        // Left wall
        { x1: room.x, y1: room.y, x2: room.x, y2: room.y + room.height, edge: 'left', type: 'room' }
      ];
      
      roomWalls.forEach(wall => {
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
    
    // Check custom walls
    walls.forEach(wall => {
      const customWall = {
        x1: wall.points[0],
        y1: wall.points[1],
        x2: wall.points[2],
        y2: wall.points[3],
        edge: 'custom',
        type: 'custom',
        id: wall.id
      };
      
      // Calculate distance from point to wall line
      const wallLength = Math.sqrt((customWall.x2 - customWall.x1) ** 2 + (customWall.y2 - customWall.y1) ** 2);
      const wallUnitX = (customWall.x2 - customWall.x1) / wallLength;
      const wallUnitY = (customWall.y2 - customWall.y1) / wallLength;
      
      // Project point onto wall line
      const toPointX = x - customWall.x1;
      const toPointY = y - customWall.y1;
      const projectionLength = toPointX * wallUnitX + toPointY * wallUnitY;
      
      // Clamp projection to wall bounds
      const clampedProjection = Math.max(0, Math.min(wallLength, projectionLength));
      
      // Calculate closest point on wall
      const closestX = customWall.x1 + wallUnitX * clampedProjection;
      const closestY = customWall.y1 + wallUnitY * clampedProjection;
      
      // Calculate distance
      const distance = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
      
      // Check if we can fit the door on this wall segment
      const availableLength = wallLength;
      const doorCanFit = doorLength <= availableLength;
      
      if (distance < minDistance && doorCanFit && distance < 50) { // 50px snap threshold
        minDistance = distance;
        nearestWall = customWall;
        
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
    
    return { nearestWall, snapPosition, distance: minDistance };
  }, [rooms, walls]);

  // Handle door drag end
  const handleDoorDragEnd = useCallback((e, doorId) => {
    if (!isEditable) return;

    // Capture the Konva drag offset before any state changes
    const dragOffsetX = e.target.x() - dragStart.x;
    const dragOffsetY = e.target.y() - dragStart.y;

    // Update door position using functional updater to always read latest state
    setDoors(prevDoors => {
      const door = prevDoors.find(d => d.id === doorId);
      if (!door) return prevDoors;

      // Calculate new door center position
      const doorCenterX = (door.points[0] + door.points[2]) / 2 + dragOffsetX;
      const doorCenterY = (door.points[1] + door.points[3]) / 2 + dragOffsetY;

      // Calculate door length
      const doorLength = Math.sqrt(
        (door.points[2] - door.points[0]) ** 2 + 
        (door.points[3] - door.points[1]) ** 2
      );

      // Find nearest wall edge
      const { nearestWall, snapPosition } = findNearestWallEdge(doorCenterX, doorCenterY, doorLength);

      let finalDoorPoints;

      if (nearestWall && snapPosition) {
        finalDoorPoints = [snapPosition.x1, snapPosition.y1, snapPosition.x2, snapPosition.y2];
      } else {
        // Return to original position if no valid wall found
        finalDoorPoints = door.points;
      }

      const updated = prevDoors.map(d => 
        d.id === doorId 
          ? { ...d, points: finalDoorPoints }
          : d
      );

      // Mark that doors were updated by user so useEffect skips re-processing
      doorsUpdatedByUserRef.current = true;

      // Notify parent component about door position change
      if (onDoorsChange) {
        onDoorsChange(updated);
      }

      return updated;
    });

    setIsDragging(false);
    setDragType(null);
    isUserInteracting.current = false;
    
    // Reset Konva element position to prevent ghost copies
    e.target.position({ x: 0, y: 0 });
  }, [isEditable, dragStart, findNearestWallEdge, onDoorsChange]);

  // Handle window drag start
  const handleWindowDragStart = useCallback((e, windowId) => {
    if (!isEditable) return;
    
    const window = windows.find(w => w.id === windowId);
    if (!window) return;
    
    setDragStart({ x: e.target.x(), y: e.target.y() });
    setSelectedWindow(windowId);
    setSelectedRoom(null);
    setSelectedDoor(null);
    setSelectedWall(null);
    setIsDragging(true);
    setDragType('window');
  }, [windows, isEditable]);

  // Handle window drag move
  const handleWindowDragMove = useCallback((e, windowId) => {
    if (!isEditable) return;
    // Allow free movement
  }, [isEditable]);

  // Handle window drag end
  const handleWindowDragEnd = useCallback((e, windowId) => {
    if (!isEditable) return;

    const window = windows.find(w => w.id === windowId);
    if (!window) return;
    
    const dragOffsetX = e.target.x() - dragStart.x;
    const dragOffsetY = e.target.y() - dragStart.y;
    
    const windowCenterX = (window.points[0] + window.points[2]) / 2 + dragOffsetX;
    const windowCenterY = (window.points[1] + window.points[3]) / 2 + dragOffsetY;
    
    const windowLength = Math.sqrt(
      (window.points[2] - window.points[0]) ** 2 + 
      (window.points[3] - window.points[1]) ** 2
    );
    
    const { nearestWall, snapPosition } = findNearestWallEdge(windowCenterX, windowCenterY, windowLength);
    
    let finalWindowPoints;
    
    if (nearestWall && snapPosition) {
      finalWindowPoints = [snapPosition.x1, snapPosition.y1, snapPosition.x2, snapPosition.y2];
    } else {
      finalWindowPoints = window.points;
    }
    
    const updatedWindows = windows.map(w => 
      w.id === windowId 
        ? { ...w, points: finalWindowPoints }
        : w
    );

    setWindows(updatedWindows);
    setIsDragging(false);
    setDragType(null);
    
    if (onWindowsChange) {
      onWindowsChange(updatedWindows);
    }
    
    e.target.position({ x: 0, y: 0 });
  }, [windows, isEditable, dragStart, findNearestWallEdge, onWindowsChange]);

  // Handle window click
  const handleWindowClick = useCallback((e, windowId) => {
    if (!isEditable) return;
    e.cancelBubble = true;
    setSelectedWindow(windowId);
    setSelectedRoom(null);
    setSelectedDoor(null);
    setSelectedWall(null);
  }, [isEditable]);

  // Add new door
  const addNewDoor = useCallback(() => {
    const newDoor = {
      id: `new-door-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      points: [200, 200, 280, 200], // Default horizontal door
      stroke: doorColor,
      strokeWidth: doorWidth,
      lineCap: 'round',
      type: 'Door'
    };
    const updatedDoors = [...doors, newDoor];
    setDoors(updatedDoors);
    setSelectedDoor(newDoor.id);
    setSelectedRoom(null);
    setSelectedWall(null);
    setSelectedWindow(null);
    
    // Notify parent component about new door
    if (onDoorsChange) {
      onDoorsChange(updatedDoors);
    }
  }, [doors, doorColor, doorWidth, onDoorsChange]);

  // Add new wall
  const addStairs = useCallback(() => {
    const newStairs = {
      id: `new-stairs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: 300,
      y: 300,
      width: 80,
      height: 120,
      direction: 'up' // 'up' or 'down'
    };
    const updatedStairs = [...stairs, newStairs];
    setStairs(updatedStairs);
    if (onStairsChange) {
      onStairsChange(updatedStairs);
    }
    setSelectedStairs(newStairs.id);
    setSelectedRoom(null);
    setSelectedDoor(null);
    setSelectedWall(null);
    setSelectedWindow(null);
  }, [stairs, onStairsChange]);

  // Calculate area from room dimensions (supports separate x/y scales)
  const calculateRoomArea = useCallback((width, height, scaleOrScaleX = 1, scaleY = null) => {
    const sX = scaleOrScaleX;
    const sY = scaleY !== null ? scaleY : scaleOrScaleX;
    const actualWidth = width / sX;
    const actualHeight = height / sY;
    return actualWidth * actualHeight;
  }, []);

  // Convert pixel area to square feet (assuming 25 pixels = 1 foot based on grid)
  const convertToSquareFeet = useCallback((pixelArea) => {
    const pixelsPerFoot = 25; // Based on grid size
    const pixelsPerSquareFoot = pixelsPerFoot * pixelsPerFoot;
    return pixelArea / pixelsPerSquareFoot;
  }, []);

  // Format area for professional display
  const formatAreaText = useCallback((squareFeet) => {
    if (squareFeet >= 1000) {
      return `${(squareFeet / 1000).toFixed(1)}k sq ft`;
    } else if (squareFeet >= 10) {
      return `${Math.round(squareFeet)} sq ft`;
    } else {
      return `${squareFeet.toFixed(1)} sq ft`;
    }
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
            width: newWidth * (r.coordScaleX || r.scale || 1), 
            height: newHeight * (r.coordScaleY || r.scale || 1),
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
    
    // Notify parent component about room deletion
    if (onRoomsChange) {
      onRoomsChange(updatedRooms);
    }
  }, [rooms, roomPercentages, rebalanceRoomPercentages]);

  // Initialize room percentages when rooms change
  useEffect(() => {
    const newPercentages = { ...roomPercentages };
    let hasChanges = false;

    rooms.forEach(room => {
      if (!newPercentages[room.id]) {
        const roomArea = calculateRoomArea(room.width, room.height, room.coordScaleX || room.scale || 1, room.coordScaleY || room.scale || 1);
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
      const totalCurrentPercentage = Object.values(newPercentages).reduce((sum, percent) => sum + percent, 0);
      
      if (totalCurrentPercentage > 0 && totalCurrentPercentage !== 100) {
        const scaleFactor = 100 / totalCurrentPercentage;
        const rebalanced = {};
        Object.keys(newPercentages).forEach(roomId => {
          rebalanced[roomId] = newPercentages[roomId] * scaleFactor;
        });
        setRoomPercentages(rebalanced);
      } else if (hasChanges) {
        setRoomPercentages(newPercentages);
      }
    }
  }, [rooms, totalFloorArea]);

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
  const handleStageMouseMovePreview = useCallback((e) => {
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
  }, [isEditable, isDragging, doors, dragStart, findNearestWallEdge]);

  // Handle wall drag end
  const handleWallDragEnd = useCallback((e, wallId) => {
    if (!isEditable) return;

    const dragX = e.target.x();
    const dragY = e.target.y();
    const wall = walls.find(w => w.id === wallId);
    
    if (!wall) return;
    
    const { offsetX, offsetY, scaledWidth, scaledHeight } = layoutProps;
    
    // The Line has been dragged, so we need to add the drag offset to all points
    const newX1 = wall.points[0] + dragX;
    const newY1 = wall.points[1] + dragY;
    const newX2 = wall.points[2] + dragX;
    const newY2 = wall.points[3] + dragY;
    
    // Constrain to plot bounds
    const constrainedX1 = Math.max(offsetX, Math.min(offsetX + scaledWidth, newX1));
    const constrainedY1 = Math.max(offsetY, Math.min(offsetY + scaledHeight, newY1));
    const constrainedX2 = Math.max(offsetX, Math.min(offsetX + scaledWidth, newX2));
    const constrainedY2 = Math.max(offsetY, Math.min(offsetY + scaledHeight, newY2));

    // Update wall position and reset the Line's x/y to 0
    const updatedWalls = walls.map(w => 
      w.id === wallId 
        ? { ...w, points: [constrainedX1, constrainedY1, constrainedX2, constrainedY2] }
        : w
    );

    setWalls(updatedWalls);
    
    // Notify parent component about the wall update
    if (onWallsChange) {
      onWallsChange(updatedWalls);
    }
    
    // Reset the Line position to 0,0 after updating points
    e.target.position({ x: 0, y: 0 });
    
    setIsDragging(false);
    setDragType(null);
  }, [walls, isEditable, onWallsChange, layoutProps]);

  // Handle room resize (for corners)
  const handleResize = useCallback((roomId, newWidth, newHeight) => {
    if (!isEditable) return;
    
    // Validate inputs - prevent NaN or invalid values
    if (!roomId || typeof newWidth !== 'number' || typeof newHeight !== 'number') {
      console.warn('Invalid resize inputs:', { roomId, newWidth, newHeight });
      return;
    }
    if (isNaN(newWidth) || isNaN(newHeight) || !isFinite(newWidth) || !isFinite(newHeight)) {
      console.warn('NaN or infinite values detected:', { newWidth, newHeight });
      return;
    }
    
    // Ensure minimum and maximum constraints
    const constrainedWidth = Math.max(50, Math.min(newWidth, 2000));
    const constrainedHeight = Math.max(50, Math.min(newHeight, 2000));

    console.log('Resizing room:', roomId, 'to', constrainedWidth, 'x', constrainedHeight);

    // Use functional setState to avoid stale closure issues
    setRooms(prevRooms => {
      const room = prevRooms.find(r => r.id === roomId);
      if (!room) return prevRooms;
      
      // Check collision with other rooms (auto-adjusts to touch borders)
      const collisionResult = constrainRoomToAvoidCollision(
        roomId, room.x, room.y, constrainedWidth, constrainedHeight,
        room.x, room.y, room.width, room.height
      );
      let finalX = collisionResult.x;
      let finalY = collisionResult.y;
      let finalWidth = collisionResult.width;
      let finalHeight = collisionResult.height;

      // Then check boundary constraints (always apply after collision adjustment)
      const boundaryConstrained = constrainRoomToBoundary(finalX, finalY, finalWidth, finalHeight, true);
      finalX = boundaryConstrained.x;
      finalY = boundaryConstrained.y;
      
      const updatedRooms = prevRooms.map(r => 
        r.id === roomId 
          ? { 
              ...r, 
              x: finalX,
              y: finalY,
              width: finalWidth, 
              height: finalHeight
            }
          : r
      );
      
      // Verify the room still exists
      const updatedRoom = updatedRooms.find(r => r.id === roomId);
      console.log('Room after update:', updatedRoom);
      
      return updatedRooms;
    });
  }, [isEditable, constrainRoomToBoundary, constrainRoomToAvoidCollision]);

  // Handle room resize with position adjustment (for left/top edge resizing)
  const handleResizeWithPosition = useCallback((roomId, newX, newY, newWidth, newHeight) => {
    if (!isEditable) return;
    
    // Validate inputs
    if (!roomId || isNaN(newWidth) || isNaN(newHeight) || isNaN(newX) || isNaN(newY)) {
      console.warn('Invalid resize inputs:', { roomId, newX, newY, newWidth, newHeight });
      return;
    }
    
    // Ensure minimum constraints
    const constrainedWidth = Math.max(50, Math.min(newWidth, 2000));
    const constrainedHeight = Math.max(50, Math.min(newHeight, 2000));
    
    setRooms(prevRooms => {
      const room = prevRooms.find(r => r.id === roomId);
      if (!room) return prevRooms;

      // Check collision with other rooms (auto-adjusts to touch borders)
      const collisionResult = constrainRoomToAvoidCollision(
        roomId, newX, newY, constrainedWidth, constrainedHeight,
        room.x, room.y, room.width, room.height
      );
      let finalX = collisionResult.x;
      let finalY = collisionResult.y;
      let finalWidth = collisionResult.width;
      let finalHeight = collisionResult.height;

      // Then check boundary constraints (always apply after collision adjustment)
      const boundaryConstrained = constrainRoomToBoundary(finalX, finalY, finalWidth, finalHeight, true);
      finalX = boundaryConstrained.x;
      finalY = boundaryConstrained.y;

      return prevRooms.map(r => 
        r.id === roomId 
          ? { 
              ...r, 
              x: finalX,
              y: finalY,
              width: finalWidth, 
              height: finalHeight
            }
          : r
      );
    });
  }, [isEditable, constrainRoomToBoundary, constrainRoomToAvoidCollision]);

  // Handle mouse move for resizing and creation preview
  const handleStageMouseMove = useCallback((e) => {
    // Handle creation preview
    if (isEditable && isCreating && newElementStart) {
      const stage = e.target.getStage();
      if (stage) {
        stage.batchDraw();
      }
    }
    
    // Handle room resizing with throttling
    if (resizingRoom && resizeHandle) {
      // Throttle to only update every 16ms (60fps)
      if (resizeThrottleRef.current) {
        return;
      }
      
      resizeThrottleRef.current = setTimeout(() => {
        resizeThrottleRef.current = null;
      }, 16);
      
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const room = rooms.find(r => r.id === resizingRoom);
      if (!room) return;

      let newX = room.x;
      let newY = room.y;
      let newWidth = room.width;
      let newHeight = room.height;

      // Handle all resize directions
      switch (resizeHandle) {
        case 'br': // Bottom-right
          newWidth = pointerPos.x - room.x;
          newHeight = pointerPos.y - room.y;
          break;
        case 'r': // Right
          newWidth = pointerPos.x - room.x;
          break;
        case 'b': // Bottom
          newHeight = pointerPos.y - room.y;
          break;
        case 't': // Top
          newHeight = room.height + (room.y - pointerPos.y);
          newY = pointerPos.y;
          break;
        case 'l': // Left
          newWidth = room.width + (room.x - pointerPos.x);
          newX = pointerPos.x;
          break;
        case 'tl': // Top-left
          newWidth = room.width + (room.x - pointerPos.x);
          newHeight = room.height + (room.y - pointerPos.y);
          newX = pointerPos.x;
          newY = pointerPos.y;
          break;
        case 'tr': // Top-right
          newWidth = pointerPos.x - room.x;
          newHeight = room.height + (room.y - pointerPos.y);
          newY = pointerPos.y;
          break;
        case 'bl': // Bottom-left
          newWidth = room.width + (room.x - pointerPos.x);
          newHeight = pointerPos.y - room.y;
          newX = pointerPos.x;
          break;
        default:
          break;
      }

      // Use the position-aware resize function for edges that change position
      if (['t', 'l', 'tl', 'tr', 'bl'].includes(resizeHandle)) {
        handleResizeWithPosition(resizingRoom, newX, newY, newWidth, newHeight);
      } else {
        handleResize(resizingRoom, newWidth, newHeight);
      }
    }
    
    // Handle stairs resizing with throttling
    if (resizingStairs && resizeHandle) {
      // Throttle to only update every 16ms (60fps)
      if (resizeThrottleRef.current) {
        return;
      }
      
      resizeThrottleRef.current = setTimeout(() => {
        resizeThrottleRef.current = null;
      }, 16);
      
      const stage = e.target.getStage();
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const stair = stairs.find(s => s.id === resizingStairs);
      if (!stair) return;

      let newWidth = stair.width;
      let newHeight = stair.height;

      // Handle resize directions (bottom-right corner only for simplicity)
      switch (resizeHandle) {
        case 'br': // Bottom-right
          newWidth = Math.max(40, pointerPos.x - stair.x);
          newHeight = Math.max(60, pointerPos.y - stair.y);
          break;
        case 'r': // Right
          newWidth = Math.max(40, pointerPos.x - stair.x);
          break;
        case 'b': // Bottom
          newHeight = Math.max(60, pointerPos.y - stair.y);
          break;
        default:
          break;
      }

      // Update stairs dimensions
      const updatedStairs = stairs.map(s =>
        s.id === resizingStairs
          ? { ...s, width: newWidth, height: newHeight }
          : s
      );
      setStairs(updatedStairs);
      if (onStairsChange) {
        onStairsChange(updatedStairs);
      }
    }
  }, [isEditable, isCreating, newElementStart, resizingRoom, resizingStairs, resizeHandle, rooms, stairs, handleResize, handleResizeWithPosition]);

  // Handle room resize end - notify parent after resize is complete
  const handleResizeEnd = useCallback((roomId) => {
    if (!isEditable) return;
    
    setRooms(prevRooms => {
      const room = prevRooms.find(r => r.id === roomId);
      if (!room) return prevRooms;

      // Use per-axis scale factors for correct coordinate conversion
      const cScaleX = room.coordScaleX || room.scale || 1;
      const cScaleY = room.coordScaleY || room.scale || 1;
      const { offsetX, offsetY } = layoutProps;

      // Convert back to original coordinates for backend
      const originalWidth = room.width / cScaleX;
      const originalHeight = room.height / cScaleY;
      const originalX = (room.x - offsetX) / cScaleX;
      const originalY = (room.y - offsetY) / cScaleY;

      // Notify parent component with original coordinates (in setTimeout to avoid render issues)
      if (onRoomUpdate) {
        setTimeout(() => {
          onRoomUpdate(roomId, {
            x: originalX,
            y: originalY,
            width: originalWidth,
            height: originalHeight
          });
        }, 0);
      }

      return prevRooms.map(r => 
        r.id === roomId 
          ? { 
              ...r, 
              originalWidth,
              originalHeight,
              originalX,
              originalY
            }
          : r
      );
    });
  }, [isEditable, onRoomUpdate, layoutProps]);

  // Handle mouse up for resizing
  const handleStageMouseUp = useCallback(() => {
    if (resizingRoom) {
      handleResizeEnd(resizingRoom);
      setResizingRoom(null);
      setResizeHandle(null);
      isUserInteracting.current = false; // Clear flag after resize ends
    }
    if (resizingStairs) {
      setResizingStairs(null);
      setResizeHandle(null);
    }
  }, [resizingRoom, resizingStairs, handleResizeEnd]);

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
            stroke: wallColor,
            strokeWidth: wallWidth,
            lineCap: 'round',
            type: 'Wall'
          };
          const updatedWalls = [...walls, newWall];
          setWalls(updatedWalls);
          setSelectedWall(newWall.id);
          
          // Notify parent component
          if (onWallsChange) {
            onWallsChange(updatedWalls);
          }
          
          setIsCreating(false);
          setNewElementStart(null);
          setCreationMode(null);
        }
      } else if (creationMode === 'window') {
        if (!isCreating) {
          // Start creating window
          setNewElementStart({ x: snappedX, y: snappedY });
          setIsCreating(true);
        } else {
          // Complete window creation
          const newWindow = {
            id: `new-window-${Date.now()}`,
            points: [newElementStart.x, newElementStart.y, snappedX, snappedY],
            stroke: windowColor,
            strokeWidth: windowWidth,
            lineCap: 'round',
            type: 'Window'
          };
          const updatedWindows = [...windows, newWindow];
          setWindows(updatedWindows);
          setSelectedWindow(newWindow.id);
          
          // Notify parent component
          if (onWindowsChange) {
            onWindowsChange(updatedWindows);
          }
          
          setIsCreating(false);
          setNewElementStart(null);
          setCreationMode(null);
        }
      }
    } else {
      // Normal click - deselect all
      setSelectedRoom(null);
      setSelectedDoor(null);
      setSelectedWall(null);
      setSelectedWindow(null);
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
    <>
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
        `}
      </style>
      <div className="flex bg-gray-50" style={{ height: '100%' }}>
        {/* Left Sidebar - Quick Add Tools */}
        {isEditable && (
        <div className="w-56 bg-white border-r border-gray-300 p-3 space-y-3 overflow-y-auto flex-shrink-0">
          {/* Quick Add Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="text-xs font-medium text-gray-900 mb-2">
              🔨 Creation Tools
            </div>
            
            <div className="space-y-2">
              {/* Quick Add Door */}
              <button
                onClick={addNewDoor}
                className="w-full px-2 py-1.5 text-xs rounded border bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
                title="Add door at center"
              >
                🚪 Add Door
              </button>
              
              {/* Quick Add Stairs */}
              <button
                onClick={addStairs}
                className="w-full px-2 py-1.5 text-xs rounded border bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
                title="Add stairs at center"
              >
                🪜 Add Stairs
              </button>
              
              {/* Quick Add Window */}
              <button
                onClick={() => {
                  const newWindow = {
                    id: `new-window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    points: [300, 200, 380, 200],
                    stroke: windowColor,
                    strokeWidth: windowWidth,
                    lineCap: 'round',
                    type: 'Window'
                  };
                  const updatedWindows = [...windows, newWindow];
                  setWindows(updatedWindows);
                  setSelectedWindow(newWindow.id);
                  setSelectedDoor(null);
                  setSelectedWall(null);
                  setSelectedRoom(null);
                  
                  if (onWindowsChange) {
                    onWindowsChange(updatedWindows);
                  }
                }}
                className="w-full px-2 py-1.5 text-xs rounded border bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100 transition-colors"
                title="Add window at center"
              >
                🪟 Add Window
              </button>
              
              {/* Quick Add Room */}
              <button
                onClick={() => setShowRoomTypeDialog(true)}
                className="w-full px-2 py-1.5 text-xs rounded border bg-purple-50 border-purple-300 text-purple-800 hover:bg-purple-100 transition-colors"
                title="Add room at center"
              >
                🏠 Add Room
              </button>
            </div>
          </div>

          {/* Grid Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="text-xs font-medium text-gray-900 mb-2">
              📐 Grid Settings
            </div>
            
            <div className="space-y-2">
              {/* Grid Snap Toggle */}
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`w-full px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                  snapToGrid 
                    ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' 
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
                title={snapToGrid ? 'Grid snap enabled (25px)' : 'Grid snap disabled'}
              >
                {snapToGrid ? '✓ 25px Grid: ON' : '✗ 25px Grid: OFF'}
              </button>
              
              <div className="text-xs text-gray-500 text-center">
                {snapToGrid 
                  ? 'Elements snap to 25px grid' 
                  : 'Free positioning enabled'}
              </div>
            </div>
          </div>

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
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="text-xs font-medium text-gray-900 mb-2">
              🏠 Room Types
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(roomTypeDistribution).map(([roomType, percentage]) => (
                <div key={roomType} className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-700">{roomType}:</span>
                  <span className="text-gray-500">
                    {getRoomsOfType(roomType).length} room{getRoomsOfType(roomType).length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
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
          pixelRatio={typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2}
          onClick={handleStageClick}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
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

          {/* Plot boundary - always visible, positioned outside boundary walls */}
          {floorPlanData ? (() => {
            // Use actual plot boundaries from layoutProps for rectangular plot
            const { offsetX, offsetY, scaledWidth, scaledHeight } = layoutProps;
            const wallThickness = 10; // Same as boundary wall thickness
            
            return (
              <Rect
                x={offsetX - wallThickness / 2}
                y={offsetY - wallThickness / 2}
                width={scaledWidth + wallThickness}
                height={scaledHeight + wallThickness}
                fill="transparent"
                stroke="#000000"
                strokeWidth={3}
              />
            );
          })() : (
            /* Fallback to canvas dimensions if no floor plan data */
            <Rect
              x={2}
              y={2}
              width={width - 4}
              height={height - 4}
              fill="transparent"
              stroke="#000000"
              strokeWidth={3}
            />
          )}

          {/* Allocated buildable area - blue bordered indicator */}
          {showAllocatedArea && floorPlanData && (() => {
            // Use actual plot boundaries from layoutProps - represents the buildable area
            const { offsetX, offsetY, scaledWidth, scaledHeight } = layoutProps;
            const padding = 10;
            
            return (
              <Rect
                x={offsetX - padding}
                y={offsetY - padding}
                width={scaledWidth + (padding * 2)}
                height={scaledHeight + (padding * 2)}
                fill="rgba(33, 150, 243, 0.05)"
                stroke="#2196F3"
                strokeWidth={2}
                dash={[10, 5]}
                listening={false}
              />
            );
          })()}

          {/* Boundary Wall - thick grey walls around the plot */}
          {floorPlanData && (() => {
            // Use actual plot boundaries from layoutProps - not room positions
            const { offsetX, offsetY, scaledWidth, scaledHeight } = layoutProps;
            
            // Fixed plot boundary dimensions
            const plotX = offsetX;
            const plotY = offsetY;
            const plotWidth = scaledWidth;
            const plotHeight = scaledHeight;
            
            const wallThickness = 10;
            
            return (
              <>
                {/* Top boundary wall */}
                <Rect
                  x={plotX - wallThickness / 2}
                  y={plotY - wallThickness / 2}
                  width={plotWidth + wallThickness}
                  height={wallThickness}
                  fill="#808080"
                  stroke="#000000"
                  strokeWidth={0.5}
                  listening={false}
                />
                {/* Bottom boundary wall */}
                <Rect
                  x={plotX - wallThickness / 2}
                  y={plotY + plotHeight - wallThickness / 2}
                  width={plotWidth + wallThickness}
                  height={wallThickness}
                  fill="#808080"
                  stroke="#000000"
                  strokeWidth={0.5}
                  listening={false}
                />
                {/* Left boundary wall */}
                <Rect
                  x={plotX - wallThickness / 2}
                  y={plotY - wallThickness / 2}
                  width={wallThickness}
                  height={plotHeight + wallThickness}
                  fill="#808080"
                  stroke="#000000"
                  strokeWidth={0.5}
                  listening={false}
                />
                {/* Right boundary wall */}
                <Rect
                  x={plotX + plotWidth - wallThickness / 2}
                  y={plotY - wallThickness / 2}
                  width={wallThickness}
                  height={plotHeight + wallThickness}
                  fill="#808080"
                  stroke="#000000"
                  strokeWidth={0.5}
                  listening={false}
                />
              </>
            );
          })()}

          {/* Setback zone overlay — inner buildable boundary + dimension labels */}
          {setbacks && floorPlanData && (() => {
            const { offsetX, offsetY, scaledWidth, scaledHeight, scaleToFit } = layoutProps;

            // Convert setback feet → canvas pixels
            const frontPx = (parseFloat(setbacks.front) || 0) * scaleToFit;
            const rearPx  = (parseFloat(setbacks.rear)  || 0) * scaleToFit;
            const leftPx  = (parseFloat(setbacks.left)  || 0) * scaleToFit;
            const rightPx = (parseFloat(setbacks.right) || 0) * scaleToFit;

            // Inner buildable area bounds
            const buildX = offsetX + leftPx;
            const buildY = offsetY + rearPx;
            const buildW = scaledWidth  - leftPx - rightPx;
            const buildH = scaledHeight - frontPx - rearPx;

            const hasAnySetback = frontPx > 2 || rearPx > 2 || leftPx > 2 || rightPx > 2;
            if (!hasAnySetback || buildW <= 0 || buildH <= 0) return null;

            const labelColor = '#E65100';
            const fontSize   = Math.max(9, Math.min(12, scaleToFit * 1.8));

            return (
              <>
                {/* Inner buildable-area boundary (dashed orange) */}
                <Rect
                  x={buildX}
                  y={buildY}
                  width={buildW}
                  height={buildH}
                  fill="transparent"
                  stroke="#E65100"
                  strokeWidth={1.5}
                  dash={[6, 4]}
                  listening={false}
                />

                {/* Rear setback label — top zone, centred */}
                {rearPx > 8 && (
                  <Text
                    x={offsetX}
                    y={offsetY + rearPx / 2 - fontSize / 2}
                    width={scaledWidth}
                    text={`Rear: ${setbacks.rear}ft`}
                    fontSize={fontSize}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill={labelColor}
                    align="center"
                    listening={false}
                  />
                )}

                {/* Front setback label — bottom zone, centred */}
                {frontPx > 8 && (
                  <Text
                    x={offsetX}
                    y={offsetY + scaledHeight - frontPx / 2 - fontSize / 2}
                    width={scaledWidth}
                    text={`Front: ${setbacks.front}ft`}
                    fontSize={fontSize}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill={labelColor}
                    align="center"
                    listening={false}
                  />
                )}

                {/* Left setback label — left zone, rotated -90° */}
                {leftPx > 8 && (
                  <Text
                    x={offsetX + leftPx / 2}
                    y={offsetY + scaledHeight / 2 + 30}
                    text={`Left: ${setbacks.left}ft`}
                    fontSize={fontSize}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill={labelColor}
                    rotation={-90}
                    listening={false}
                  />
                )}

                {/* Right setback label — right zone, rotated 90° */}
                {rightPx > 8 && (
                  <Text
                    x={offsetX + scaledWidth - rightPx / 2}
                    y={offsetY + scaledHeight / 2 - 30}
                    text={`Right: ${setbacks.right}ft`}
                    fontSize={fontSize}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill={labelColor}
                    rotation={90}
                    listening={false}
                  />
                )}
              </>
            );
          })()}

          {/* Rooms */}
          {rooms.map((room, index) => {
            // Always render the room being resized or dragged, or if it's the selected room
            const isBeingResized = resizingRoom === room.id;
            const isBeingDragged = isDragging && selectedRoom === room.id;
            const isSelected = selectedRoom === room.id;
            
            // Validate room has all required properties
            const isValid = room && 
              typeof room.x === 'number' && 
              typeof room.y === 'number' && 
              typeof room.width === 'number' && 
              typeof room.height === 'number' &&
              !isNaN(room.x) && 
              !isNaN(room.y) && 
              !isNaN(room.width) && 
              !isNaN(room.height) &&
              room.width > 0 && 
              room.height > 0;
            
            // Always show the room if it's being interacted with
            if (!isValid && !isBeingResized && !isBeingDragged && !isSelected) {
              console.error('Invalid room detected:', room);
              return null;
            }
            
            // Ensure minimum dimensions for rendering
            const renderWidth = Math.max(1, room.width || 50);
            const renderHeight = Math.max(1, room.height || 50);
            
            return (
            <Group key={room.id}>
              {/* Room rectangle */}
              <Rect
                x={room.x}
                y={room.y}
                width={renderWidth}
                height={renderHeight}
                fill={room.fill}
                stroke={selectedRoom === room.id ? '#2196F3' : room.stroke}
                strokeWidth={selectedRoom === room.id ? 3 : room.strokeWidth}
                draggable={room.draggable}
                onDragStart={(e) => handleRoomDragStart(e, room.id)}
                onDragMove={(e) => handleRoomDragMove(e, room.id)}
                onDragEnd={(e) => handleRoomDragEnd(e, room.id)}
                onClick={(e) => handleRoomClick(e, room.id)}
                onContextMenu={(e) => handleContextMenu(e, 'room', room.id)}
                style={{ cursor: isEditable ? 'move' : 'default' }}
                shadowBlur={selectedRoom === room.id ? 10 : 0}
                shadowColor="rgba(33, 150, 243, 0.5)"
              />

              {/* Room label - centered */}
              <Text
                x={room.x}
                y={room.y + renderHeight / 2}
                text={room.name || 'Room'}
                fontSize={Math.min(16, Math.max(10, Math.min(renderWidth, renderHeight) / 9))}
                fontFamily="Arial"
                fontStyle="bold"
                fill="#000000"
                align="center"
                verticalAlign="middle"
                width={renderWidth}
                offsetY={18}
                listening={false}
              />

              {/* Room area - professional format */}
              <Text
                x={room.x}
                y={room.y + renderHeight / 2}
                text={formatAreaText(((renderWidth / layoutProps.scaledWidth) * layoutProps.actualLength) * ((renderHeight / layoutProps.scaledHeight) * layoutProps.actualWidth))}
                fontSize={Math.min(14, Math.max(9, Math.min(renderWidth, renderHeight) / 10))}
                fontFamily="Arial"
                fontStyle="bold"
                fill="#2563eb"
                align="center"
                verticalAlign="middle"
                width={renderWidth}
                offsetY={2}
                listening={false}
              />

              {/* Room dimensions - below area (internal room dimensions) */}
              <Text
                x={room.x}
                y={room.y + renderHeight / 2}
                text={`${Math.round((renderWidth / layoutProps.scaledWidth) * layoutProps.actualLength)}'×${Math.round((renderHeight / layoutProps.scaledHeight) * layoutProps.actualWidth)}'`}
                fontSize={Math.min(10, Math.max(7, Math.min(renderWidth, renderHeight) / 15))}
                fontFamily="Arial"
                fill="#6b7280"
                align="center"
                verticalAlign="middle"
                width={renderWidth}
                offsetY={-12}
                listening={false}
              />

              {/* Resize handles for selected room */}
              {selectedRoom === room.id && isEditable && (
                <>
                  {/* Bottom-right corner handle */}
                  <Rect
                    x={room.x + renderWidth - 4}
                    y={room.y + renderHeight - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      isUserInteracting.current = true;
                      setDragStart({ x: room.x, y: room.y, width: room.width, height: room.height });
                      setResizingRoom(room.id);
                      setResizeHandle('br');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'nwse-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingRoom) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                  
                  {/* Right edge handle */}
                  <Rect
                    x={room.x + renderWidth - 4}
                    y={room.y + renderHeight / 2 - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      isUserInteracting.current = true;
                      setDragStart({ x: room.x, y: room.y, width: room.width, height: room.height });
                      setResizingRoom(room.id);
                      setResizeHandle('r');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'ew-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingRoom) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                  
                  {/* Bottom edge handle */}
                  <Rect
                    x={room.x + renderWidth / 2 - 4}
                    y={room.y + renderHeight - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      isUserInteracting.current = true;
                      setDragStart({ x: room.x, y: room.y, width: room.width, height: room.height });
                      setResizingRoom(room.id);
                      setResizeHandle('b');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'ns-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingRoom) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                  
                  {/* Top edge handle */}
                  <Rect
                    x={room.x + renderWidth / 2 - 4}
                    y={room.y - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      isUserInteracting.current = true;
                      setDragStart({ x: room.x, y: room.y, width: room.width, height: room.height });
                      setResizingRoom(room.id);
                      setResizeHandle('t');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'ns-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingRoom) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                  
                  {/* Left edge handle */}
                  <Rect
                    x={room.x - 4}
                    y={room.y + renderHeight / 2 - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      isUserInteracting.current = true;
                      setDragStart({ x: room.x, y: room.y, width: room.width, height: room.height });
                      setResizingRoom(room.id);
                      setResizeHandle('l');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'ew-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingRoom) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                  
                  {/* Top-left corner handle */}
                  <Rect
                    x={room.x - 4}
                    y={room.y - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      isUserInteracting.current = true;
                      setDragStart({ x: room.x, y: room.y, width: room.width, height: room.height });
                      setResizingRoom(room.id);
                      setResizeHandle('tl');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'nwse-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingRoom) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                  
                  {/* Top-right corner handle */}
                  <Rect
                    x={room.x + renderWidth - 4}
                    y={room.y - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      isUserInteracting.current = true;
                      setDragStart({ x: room.x, y: room.y, width: room.width, height: room.height });
                      setResizingRoom(room.id);
                      setResizeHandle('tr');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'nesw-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingRoom) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                  
                  {/* Bottom-left corner handle */}
                  <Rect
                    x={room.x - 4}
                    y={room.y + renderHeight - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      isUserInteracting.current = true;
                      setDragStart({ x: room.x, y: room.y, width: room.width, height: room.height });
                      setResizingRoom(room.id);
                      setResizeHandle('bl');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'nesw-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingRoom) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                </>
              )}
            </Group>
            );
          })}

          {/* Room Overlaps - Show overlapping areas in red translucent */}
          {isEditable && rooms.map((room1, i) => 
            rooms.slice(i + 1).map((room2, j) => {
              // Calculate overlap between room1 and room2
              const overlapLeft = Math.max(room1.x, room2.x);
              const overlapTop = Math.max(room1.y, room2.y);
              const overlapRight = Math.min(room1.x + room1.width, room2.x + room2.width);
              const overlapBottom = Math.min(room1.y + room1.height, room2.y + room2.height);
              
              const overlapWidth = overlapRight - overlapLeft;
              const overlapHeight = overlapBottom - overlapTop;
              
              // Only render if there's actual overlap (both dimensions positive)
              if (overlapWidth > 0 && overlapHeight > 0) {
                return (
                  <Rect
                    key={`overlap-${room1.id}-${room2.id}-${j}`}
                    x={overlapLeft}
                    y={overlapTop}
                    width={overlapWidth}
                    height={overlapHeight}
                    fill="rgba(255, 0, 0, 0.3)"
                    stroke="rgba(255, 0, 0, 0.6)"
                    strokeWidth={2}
                    listening={false}
                    dash={[5, 5]}
                  />
                );
              }
              return null;
            })
          )}

          {/* Walls - render on top of rooms */}
          {showWalls && walls.map(wall => (
            <Group key={wall.id}>
              <Line
                x={0}
                y={0}
                points={wall.points}
                stroke={selectedWall === wall.id ? '#2196F3' : wall.stroke}
                strokeWidth={selectedWall === wall.id ? wall.strokeWidth + 2 : wall.strokeWidth}
                lineCap={wall.lineCap}
                draggable={isEditable}
                onDragStart={(e) => handleWallDragStart(e, wall.id)}
                onDragEnd={(e) => handleWallDragEnd(e, wall.id)}
                onClick={(e) => handleWallClick(e, wall.id)}
                onContextMenu={(e) => handleContextMenu(e, 'wall', wall.id)}
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
                    onDragEnd={(e) => {
                      const newX = e.target.x();
                      const newY = e.target.y();
                      // Reset position first to avoid visual glitch
                      e.target.position({ x: 0, y: 0 });
                      // Update wall points with new position
                      const updatedWalls = walls.map(w => 
                        w.id === wall.id 
                          ? { ...w, points: [newX, newY, w.points[2], w.points[3]] }
                          : w
                      );
                      setWalls(updatedWalls);
                      if (onWallsChange) {
                        onWallsChange(updatedWalls);
                      }
                    }}
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
                    onDragEnd={(e) => {
                      const newX = e.target.x();
                      const newY = e.target.y();
                      // Reset position first to avoid visual glitch
                      e.target.position({ x: 0, y: 0 });
                      // Update wall points with new position
                      const updatedWalls = walls.map(w => 
                        w.id === wall.id 
                          ? { ...w, points: [w.points[0], w.points[1], newX, newY] }
                          : w
                      );
                      setWalls(updatedWalls);
                      if (onWallsChange) {
                        onWallsChange(updatedWalls);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </>
              )}
            </Group>
          ))}

          {/* Stairs - render on top of walls */}
          {stairs.map(stair => (
            <Group key={stair.id}>
              {/* Stairs rectangle background */}
              <Rect
                x={stair.x}
                y={stair.y}
                width={stair.width}
                height={stair.height}
                fill="#f59e0b"
                stroke={selectedStairs === stair.id ? '#2196F3' : '#d97706'}
                strokeWidth={selectedStairs === stair.id ? 3 : 2}
                draggable={isEditable && !resizingStairs}
                onDragStart={(e) => {
                  if (resizingStairs) {
                    e.target.stopDrag();
                  }
                }}
                onDragEnd={(e) => {
                  const updatedStairs = stairs.map(s => 
                    s.id === stair.id 
                      ? { ...s, x: e.target.x(), y: e.target.y() }
                      : s
                  );
                  setStairs(updatedStairs);
                  if (onStairsChange) {
                    onStairsChange(updatedStairs);
                  }
                }}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedStairs(stair.id);
                  setSelectedRoom(null);
                  setSelectedDoor(null);
                  setSelectedWall(null);
                  setSelectedWindow(null);
                }}
                onContextMenu={(e) => handleContextMenu(e, 'stairs', stair.id)}
                style={{ cursor: isEditable ? 'move' : 'default' }}
              />
              {/* Stair steps lines */}
              {Array.from({ length: 8 }, (_, i) => (
                <Line
                  key={`step-${i}`}
                  points={[
                    stair.x,
                    stair.y + (i + 1) * (stair.height / 9),
                    stair.x + stair.width,
                    stair.y + (i + 1) * (stair.height / 9)
                  ]}
                  stroke="#92400e"
                  strokeWidth={1.5}
                  listening={false}
                />
              ))}
              {/* Direction arrow */}
              <Text
                x={stair.x}
                y={stair.y + stair.height / 2 - 10}
                text={stair.direction === 'up' ? '↑' : '↓'}
                fontSize={24}
                fill="#78350f"
                align="center"
                verticalAlign="middle"
                width={stair.width}
                listening={false}
              />
              {/* Stairs label */}
              <Text
                x={stair.x}
                y={stair.y + stair.height / 2 + 12}
                text="STAIRS"
                fontSize={10}
                fontFamily="Arial"
                fontStyle="bold"
                fill="#78350f"
                align="center"
                verticalAlign="middle"
                width={stair.width}
                listening={false}
              />
              
              {/* Resize handles for selected stairs */}
              {selectedStairs === stair.id && isEditable && (
                <>
                  {/* Bottom-right corner handle */}
                  <Rect
                    x={stair.x + stair.width - 4}
                    y={stair.y + stair.height - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      setResizingStairs(stair.id);
                      setResizeHandle('br');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'nwse-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingStairs) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                  
                  {/* Right edge handle */}
                  <Rect
                    x={stair.x + stair.width - 4}
                    y={stair.y + stair.height / 2 - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      setResizingStairs(stair.id);
                      setResizeHandle('r');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'ew-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingStairs) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
                  />
                  
                  {/* Bottom edge handle */}
                  <Rect
                    x={stair.x + stair.width / 2 - 4}
                    y={stair.y + stair.height - 4}
                    width={8}
                    height={8}
                    fill="#2196F3"
                    stroke="#1976D2"
                    strokeWidth={1}
                    onMouseDown={(e) => {
                      e.cancelBubble = true;
                      setResizingStairs(stair.id);
                      setResizeHandle('b');
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage().container();
                      container.style.cursor = 'ns-resize';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingStairs) {
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }
                    }}
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
                  x={0}
                  y={0}
                  points={[x1, y1, x2, y2]}
                  stroke={isSelected ? "#2196F3" : "#8B4513"}
                  strokeWidth={Math.max(8, door.strokeWidth * 2)}
                  lineCap="round"
                  draggable={isEditable}
                  onDragStart={(e) => handleDoorDragStart(e, door.id)}
                  onDragEnd={(e) => handleDoorDragEnd(e, door.id)}
                  onClick={(e) => handleDoorClick(e, door.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'door', door.id)}
                  style={{ cursor: isEditable ? 'move' : 'default' }}
                />
                
                {/* Door endpoint handles - draggable */}
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
                      onDragEnd={(e) => {
                        const newX = e.target.x();
                        const newY = e.target.y();
                        // Reset position first to avoid visual glitch
                        e.target.position({ x: 0, y: 0 });
                        // Update door points with functional updater
                        doorsUpdatedByUserRef.current = true;
                        setDoors(prev => {
                          const updated = prev.map(d =>
                            d.id === door.id
                              ? { ...d, points: [newX, newY, d.points[2], d.points[3]] }
                              : d
                          );
                          if (onDoorsChange) onDoorsChange(updated);
                          return updated;
                        });
                      }}
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
                      onDragEnd={(e) => {
                        const newX = e.target.x();
                        const newY = e.target.y();
                        // Reset position first to avoid visual glitch
                        e.target.position({ x: 0, y: 0 });
                        // Update door points with functional updater
                        doorsUpdatedByUserRef.current = true;
                        setDoors(prev => {
                          const updated = prev.map(d =>
                            d.id === door.id
                              ? { ...d, points: [d.points[0], d.points[1], newX, newY] }
                              : d
                          );
                          if (onDoorsChange) onDoorsChange(updated);
                          return updated;
                        });
                      }}
                      style={{ cursor: 'move' }}
                    />
                  </>
                )}
              </Group>
            );
          })}

          {/* Windows - render on top */}
          {windows.map(window => {
            const x1 = window.points[0];
            const y1 = window.points[1];
            const x2 = window.points[2];
            const y2 = window.points[3];
            
            const isSelected = selectedWindow === window.id;
            
            return (
              <Group key={window.id}>
                {/* Window - light blue line */}
                <Line
                  points={[x1, y1, x2, y2]}
                  stroke={isSelected ? "#2196F3" : "#87CEEB"}
                  strokeWidth={Math.max(6, window.strokeWidth * 1.5)}
                  lineCap="round"
                  draggable={isEditable}
                  onDragStart={(e) => handleWindowDragStart(e, window.id)}
                  onDragMove={(e) => handleWindowDragMove(e, window.id)}
                  onDragEnd={(e) => handleWindowDragEnd(e, window.id)}
                  onClick={(e) => handleWindowClick(e, window.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'window', window.id)}
                  style={{ cursor: isEditable ? 'move' : 'default' }}
                />
                
                {/* Window selection indicators */}
                {isSelected && isEditable && (
                  <>
                    {/* Start point handle */}
                    <Circle
                      x={x1}
                      y={y1}
                      radius={6}
                      fill="#87CEEB"
                      stroke="#4682B4"
                      strokeWidth={2}
                      draggable={false}
                    />
                    {/* End point handle */}
                    <Circle
                      x={x2}
                      y={y2}
                      radius={6}
                      fill="#87CEEB"
                      stroke="#4682B4"
                      strokeWidth={2}
                      draggable={false}
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

      {/* Context Menu for delete */}
      {contextMenu.visible && isEditable && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '120px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#d32f2f'
            }}
            onClick={handleDeleteFromContextMenu}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
            </svg>
            Delete {contextMenu.type}
          </div>
        </div>
      )}

      {/* Warning Notifications - Right Side Middle List */}
      <div style={{
        position: 'fixed',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 1001,
        maxWidth: '320px'
      }}>
        {/* Boundary Warning Notification */}
        {boundaryWarning && isEditable && (
          <div
            style={{
              backgroundColor: '#ff9800',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'fadeInOut 2s ease-in-out'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Outside allocated area! Auto-adjusted to fit boundary.</span>
          </div>
        )}

        {/* Collision Warning Notification */}
        {collisionWarning && isEditable && (
          <div
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'fadeInOut 2s ease-in-out'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>Room overlaps detected! Auto-adjusted to avoid collision.</span>
          </div>
        )}
      </div>

      {/* Room Type Selection Dialog */}
      {showRoomTypeDialog && isEditable && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowRoomTypeDialog(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                Select Room Type
              </h3>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Choose the type of room you want to add to your floor plan
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {roomTypes.map((roomType) => (
                <button
                  key={roomType.key}
                  onClick={() => {
                    const roomId = `new-room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const roomCount = rooms.filter(r => r.type && r.type.startsWith(roomType.key)).length + 1;
                    
                    // Use centered layout props with per-axis scales
                    const { offsetX, offsetY, scale, coordScaleX, coordScaleY } = layoutProps;
                    
                    // Define backend (original) dimensions first
                    const backendWidth = 150;
                    const backendHeight = 120;
                    const backendX = 60;
                    const backendY = 60;
                    
                    const newRoom = {
                      id: roomId,
                      x: backendX * coordScaleX + offsetX,
                      y: backendY * coordScaleY + offsetY,
                      width: backendWidth * coordScaleX,
                      height: backendHeight * coordScaleY,
                      fill: getRoomColor(roomType.key),
                      stroke: '#333',
                      strokeWidth: 2,
                      draggable: isEditable,
                      tag: `${roomType.label} ${roomCount}`,
                      type: roomType.key,
                      name: `${roomType.label} ${roomCount}`,
                      originalX: backendX,
                      originalY: backendY,
                      originalWidth: backendWidth,
                      originalHeight: backendHeight,
                      coordScaleX: coordScaleX,
                      coordScaleY: coordScaleY,
                      scale: scale
                    };
                    
                    const updatedRooms = [...rooms, newRoom];
                    setRooms(updatedRooms);
                    setSelectedRoom(roomId);
                    setSelectedDoor(null);
                    setSelectedWall(null);
                    setSelectedWindow(null);
                    
                    // Initialize percentage for new room (use backend dimensions for area)
                    const roomArea = backendWidth * backendHeight;
                    const percentage = calculateAreaPercentage(roomArea);
                    setRoomPercentages(prev => ({
                      ...prev,
                      [roomId]: percentage
                    }));
                    
                    if (onRoomsChange) {
                      onRoomsChange(updatedRooms);
                    }
                    
                    setShowRoomTypeDialog(false);
                  }}
                  style={{
                    padding: '16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ED7600';
                    e.currentTarget.style.backgroundColor = '#FFF8F0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                    {roomType.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowRoomTypeDialog(false)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e0e0e0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
});

KonvaFloorPlan.displayName = 'KonvaFloorPlan';

export default KonvaFloorPlan;