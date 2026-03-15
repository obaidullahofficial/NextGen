import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import KonvaFloorPlan from '../../components/FloorPlan/KonvaFloorPlan';
import jsPDF from 'jspdf';

// Dynamic import for 3D component with fallback
const FloorPlan3D = React.lazy(() => 
  import('../../components/FloorPlan/FloorPlan3D').catch(() => ({
    default: () => (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">ðŸ—ï¸</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">3D Viewer Unavailable</h3>
          <p className="text-gray-600 text-sm mb-4">
            The 3D viewer requires additional dependencies. Please install Three.js packages:
          </p>
          <code className="bg-gray-200 px-3 py-1 rounded text-sm">
            npm install three @react-three/fiber @react-three/drei
          </code>
        </div>
      </div>
    )
  }))
);

const FloorPlanCustomization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stageRef = useRef(null);
  const [floorPlanData, setFloorPlanData] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  const [isFirstSave, setIsFirstSave] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get floor plan data from navigation state
  useEffect(() => {
    const initializeFloorPlan = async () => {
      // Prevent duplicate initialization
      if (isInitialized) {
        console.log('â­ï¸ Already initialized, skipping');
        return;
      }
      
      if (location.state?.floorPlan) {
        const floorPlan = location.state.floorPlan;
        
        // Check if floor plan has database ID to determine if it's a new or existing floorplan
        if (!floorPlan._id) {
          console.log('ðŸ†• New floor plan from generator (no database ID)');
          console.log('Floor plan data:', floorPlan);
          setFloorPlanData(floorPlan);
          setIsFirstSave(true); // This is a new floorplan
        } else {
          console.log('âœ… Loading existing floor plan with ID:', floorPlan._id || floorPlan.id);
          
          // CRITICAL FIX: Flatten floor_plan_data to top level
          // The backend stores dimensions inside floor_plan_data, but KonvaFloorPlan expects them at top level
          const normalizedData = {
            ...floorPlan,
            // Extract from floor_plan_data if it exists
            plotWidth: floorPlan.plotWidth || floorPlan.floor_plan_data?.plotWidth || 1000,
            plotHeight: floorPlan.plotHeight || floorPlan.floor_plan_data?.plotHeight || 1000,
            actualLength: floorPlan.actualLength || floorPlan.floor_plan_data?.actualLength || 55,
            actualWidth: floorPlan.actualWidth || floorPlan.floor_plan_data?.actualWidth || 25,
            rooms: floorPlan.rooms || floorPlan.floor_plan_data?.rooms || floorPlan.room_data || [],
            mapData: floorPlan.mapData || floorPlan.floor_plan_data?.mapData || [],
            walls: floorPlan.walls || floorPlan.floor_plan_data?.walls || [],
            doors: floorPlan.doors || floorPlan.floor_plan_data?.doors || [],
            windows: floorPlan.windows || floorPlan.floor_plan_data?.windows || []
          };
          
          console.log('ðŸ“Š Floor plan dimensions:', {
            plotWidth: normalizedData.plotWidth,
            plotHeight: normalizedData.plotHeight,
            actualLength: normalizedData.actualLength,
            actualWidth: normalizedData.actualWidth
          });
          
          // CRITICAL VALIDATION: Check if dimension values are reasonable
          if (!normalizedData.plotWidth || !normalizedData.plotHeight) {
            console.warn('âš ï¸ WARNING: plotWidth or plotHeight missing! Using defaults.');
          }
          if (!normalizedData.actualLength || !normalizedData.actualWidth) {
            console.warn('âš ï¸ WARNING: actualLength or actualWidth missing! Using defaults.');
          }
          
          console.log('ðŸ  Rooms count:', normalizedData.rooms?.length || 0);
          console.log('ðŸ“¦ MapData items:', normalizedData.mapData?.length || 0);
          
          if (normalizedData.rooms && normalizedData.rooms.length > 0) {
            console.log('ðŸ  First room data (backend coords):', normalizedData.rooms[0]);
          }
          
          const stairsInMapData = (normalizedData.mapData || []).filter(item => 
            item.type === 'Stairs' || item.type === 'stairs'
          );
          if (stairsInMapData.length > 0) {
            console.log('ðŸªœ Stairs loaded from database:', stairsInMapData);
          }
          
          setFloorPlanData(normalizedData);
          setIsFirstSave(false); // This is an existing floorplan
        }
        
        // Mark as initialized to prevent re-processing
        setIsInitialized(true);
      } else {
        console.log('âŒ No floor plan in navigation state');
        setIsInitialized(true); // Mark as initialized even if no data
        // If no floor plan data, redirect back to generator
        navigate('/floor-plan/generate', { replace: true });
      }
    };

    initializeFloorPlan();
  }, [location.state, navigate]);

  // Handle room updates (called during drag/resize with BACKEND coordinates)
  const handleRoomUpdate = useCallback((roomId, newProperties) => {
    console.log(`ðŸ”„ handleRoomUpdate for ${roomId}:`, newProperties);
    
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const updatedData = { ...prevData };
      updatedData.rooms = updatedData.rooms.map(room => {
        if (room.id === roomId || `room-${room.id}` === roomId || room.tag === roomId) {
          const updated = { ...room, ...newProperties };
          console.log(`   Updated room ${roomId} in floorPlanData:`, {
            old: { x: room.x, y: room.y, w: room.width, h: room.height },
            new: { x: updated.x, y: updated.y, w: updated.width, h: updated.height }
          });
          return updated;
        }
        return room;
      });
      
      return updatedData;
    });
    
    setHasUnsavedChanges(true);
  }, []);

  // Helper: Replicate KonvaFloorPlan's exact layoutProps calculation so we can
  // accurately convert Konva-canvas coordinates back to 0-1000 backend coords.
  // This MUST stay in sync with KonvaFloorPlan's useMemo layoutProps block.
  const getLayoutProps = useCallback((data) => {
    const minMargin = 40;
    const canvasWidth  = window.innerWidth - 280;
    const canvasHeight = window.innerHeight - 180;
    const plotWidth  = data.plotWidth  || 1000;
    const plotHeight = data.plotHeight || 1000;
    const actualLength = data.actualLength || 55;   // feet â€“ horizontal
    const actualWidth  = data.actualWidth  || 25;    // feet â€“ vertical

    const availableWidth  = canvasWidth  - minMargin * 2;
    const availableHeight = canvasHeight - minMargin * 2;

    const scaleToFit   = Math.min(availableWidth / actualLength, availableHeight / actualWidth);
    const scaledWidth  = actualLength * scaleToFit;
    const scaledHeight = actualWidth  * scaleToFit;

    const coordScaleX = scaledWidth  / plotWidth;
    const coordScaleY = scaledHeight / plotHeight;

    const offsetX = (canvasWidth  - scaledWidth)  / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    return { offsetX, offsetY, coordScaleX, coordScaleY, scaledWidth, scaledHeight };
  }, []);

  // Handle rooms change (add/remove)
  const handleRoomsChange = useCallback((updatedRooms) => {
    console.log('ðŸ  handleRoomsChange called with', updatedRooms.length, 'rooms');
    
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const { offsetX, offsetY, coordScaleX, coordScaleY } = getLayoutProps(prevData);
      
      console.log('ðŸ”§ Coordinate conversion factors:', { offsetX, offsetY, coordScaleX, coordScaleY });
      
      // Convert ALL Konva rooms back to backend format
      // IMPORTANT: Always convert current x/y/width/height back to backend coords
      // because they are in Konva canvas coordinates after any drag/resize operation
      const backendRooms = updatedRooms.map(room => {
        const backendRoom = {
          id: room.id,
          x: (room.x - offsetX) / coordScaleX,
          y: (room.y - offsetY) / coordScaleY,
          width: room.width / coordScaleX,
          height: room.height / coordScaleY,
          type: room.type,
          tag: room.tag,
          name: room.name
        };
        
        console.log(`  Room ${room.id}:`, {
          konva: { x: room.x, y: room.y, width: room.width, height: room.height },
          backend: { x: backendRoom.x, y: backendRoom.y, width: backendRoom.width, height: backendRoom.height }
        });
        
        return backendRoom;
      });
      
      console.log('âœ… Converted all rooms to backend coordinates');
      
      return {
        ...prevData,
        rooms: backendRooms
      };
    });
    
    setHasUnsavedChanges(true);
  }, [getLayoutProps]);

  // Handle walls change (add/remove/resize)
  const handleWallsChange = useCallback((updatedWalls) => {
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const { offsetX, offsetY, coordScaleX, coordScaleY } = getLayoutProps(prevData);
      
      // Convert ALL Konva walls to backend format using correct per-axis scales
      const backendWalls = updatedWalls.map(wall => {
        return {
          type: 'Wall',
          id: wall.id,
          x1: (wall.points[0] - offsetX) / coordScaleX,
          y1: (wall.points[1] - offsetY) / coordScaleY,
          x2: (wall.points[2] - offsetX) / coordScaleX,
          y2: (wall.points[3] - offsetY) / coordScaleY
        };
      });
      
      // Keep only non-wall items from mapData (doors, etc.)
      const nonWallMapData = (prevData.mapData || []).filter(item => 
        item.type !== 'Wall' && item.type !== 'wall'
      );
      
      return {
        ...prevData,
        mapData: [
          ...nonWallMapData,
          ...backendWalls
        ]
      };
    });
    
    setHasUnsavedChanges(true);
  }, [getLayoutProps]);

  // Handle doors change (add/remove)
  const handleDoorsChange = useCallback((updatedDoors) => {
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const { offsetX, offsetY, coordScaleX, coordScaleY } = getLayoutProps(prevData);
      
      // Convert ALL Konva doors to backend format using correct per-axis scales
      const backendDoors = updatedDoors.map(door => {
        return {
          type: 'Door',
          id: door.id, // Keep the ID so we can track it
          x1: (door.points[0] - offsetX) / coordScaleX,
          y1: (door.points[1] - offsetY) / coordScaleY,
          x2: (door.points[2] - offsetX) / coordScaleX,
          y2: (door.points[3] - offsetY) / coordScaleY
        };
      });
      
      // Keep only non-door items from mapData (walls, etc.)
      const nonDoorMapData = (prevData.mapData || []).filter(item => 
        item.type !== 'Door' && item.type !== 'door'
      );
      
      return {
        ...prevData,
        mapData: [
          ...nonDoorMapData,
          ...backendDoors
        ]
      };
    });
    
    setHasUnsavedChanges(true);
  }, [getLayoutProps]);

  // Handle window changes from Konva editor
  const handleWindowsChange = useCallback((updatedWindows) => {
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const { offsetX, offsetY, coordScaleX, coordScaleY } = getLayoutProps(prevData);
      
      // Convert ALL Konva windows to backend format using correct per-axis scales
      const backendWindows = updatedWindows.map(win => {
        return {
          type: 'Window',
          id: win.id,
          x1: (win.points[0] - offsetX) / coordScaleX,
          y1: (win.points[1] - offsetY) / coordScaleY,
          x2: (win.points[2] - offsetX) / coordScaleX,
          y2: (win.points[3] - offsetY) / coordScaleY
        };
      });
      
      // Keep only non-window items from mapData
      const nonWindowMapData = (prevData.mapData || []).filter(item => 
        item.type !== 'Window' && item.type !== 'window'
      );
      
      return {
        ...prevData,
        mapData: [
          ...nonWindowMapData,
          ...backendWindows
        ]
      };
    });
    
    setHasUnsavedChanges(true);
  }, [getLayoutProps]);

  // Handle stairs changes from Konva editor
  const handleStairsChange = useCallback((updatedStairs) => {
    console.log('ðŸªœ handleStairsChange called with', updatedStairs.length, 'stairs');
    console.log('   Raw Konva stairs:', updatedStairs.map(s => ({ id: s.id, x: s.x, y: s.y, w: s.width, h: s.height })));
    
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const { offsetX, offsetY, coordScaleX, coordScaleY } = getLayoutProps(prevData);
      
      // Convert ALL Konva stairs to backend format using correct per-axis scales
      const backendStairs = updatedStairs.map(stair => {
        const converted = {
          type: 'Stairs',
          id: stair.id,
          x: (stair.x - offsetX) / coordScaleX,
          y: (stair.y - offsetY) / coordScaleY,
          width: stair.width / coordScaleX,
          height: stair.height / coordScaleY,
          direction: stair.direction || 'up'
        };
        
        console.log(`   Converting ${stair.id}:`, {
          konva: { x: stair.x, y: stair.y, w: stair.width, h: stair.height },
          backend: { x: converted.x.toFixed(1), y: converted.y.toFixed(1), w: converted.width.toFixed(1), h: converted.height.toFixed(1) }
        });
        
        return converted;
      });
      
      console.log('ðŸªœ Converted stairs to backend format:', backendStairs);
      
      // Keep only non-stairs items from mapData
      const nonStairsMapData = (prevData.mapData || []).filter(item => 
        item.type !== 'Stairs' && item.type !== 'stairs'
      );
      
      const newMapData = [
        ...nonStairsMapData,
        ...backendStairs
      ];
      
      console.log('ðŸ“¦ Updated mapData:', {
        total: newMapData.length,
        stairs: backendStairs.length,
        other: nonStairsMapData.length
      });
      
      return {
        ...prevData,
        mapData: newMapData
      };
    });
    
    setHasUnsavedChanges(true);
  }, [getLayoutProps]);

  // Download floorplan as PDF in black and white format
  const downloadPDF = useCallback(() => {
    if (!floorPlanData) {
      alert('No floorplan to download');
      return;
    }

    try {
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
      
      // Calculate scaling
      const margin = 80;
      const plotWidth = floorPlanData.plotWidth || 1000;
      const plotHeight = floorPlanData.plotHeight || 1000;
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
        // Get actual plot dimensions for accurate conversion
        const actualLength = floorPlanData.actualLength || plotWidth;
        const actualWidth = floorPlanData.actualWidth || plotHeight;
        
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
          
          // Convert to actual feet using plot dimensions (matching KonvaFloorPlan)
          const roomWidthBackend = room.width || 0;
          const roomHeightBackend = room.height || 0;
          const widthInFeet = Math.round((roomWidthBackend / plotWidth) * actualLength);
          const heightInFeet = Math.round((roomHeightBackend / plotHeight) * actualWidth);
          const areaInSqFt = widthInFeet * heightInFeet;
          
          const dimensions = `${widthInFeet}' x ${heightInFeet}'`;
          const areaText = `${areaInSqFt} sq ft`;
          
          // Draw room name
          ctx.fillText(label, x + w / 2, y + h / 2 - 14);
          // Draw area (matching Konva blue color in grayscale will be dark gray)
          ctx.font = 'bold 10px Arial';
          ctx.fillText(areaText, x + w / 2, y + h / 2);
          // Draw dimensions
          ctx.font = '9px Arial';
          ctx.fillStyle = '#555555';
          ctx.fillText(dimensions, x + w / 2, y + h / 2 + 12);
        });
      }
      
      // Validation threshold for corrupted coordinates
      const maxReasonableCoord = 3000;
      
      // Draw walls (internal) as rectangles - check multiple data sources like KonvaFloorPlan
      let wallsData = [];
      
      // Method 1: Check mapData for walls  
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData) && (!floorPlanData.rooms || floorPlanData.rooms.length === 0)) {
        const mapWalls = floorPlanData.mapData.filter(item => {
          if (item.type !== 'Wall') return false;
          // VALIDATION: Skip walls with corrupted coordinates
          const x1 = item.x1 || 0;
          const y1 = item.y1 || 0;
          const x2 = item.x2 || 0;
          const y2 = item.y2 || 0;
          if (Math.abs(x1) > maxReasonableCoord || Math.abs(y1) > maxReasonableCoord ||
              Math.abs(x2) > maxReasonableCoord || Math.abs(y2) > maxReasonableCoord) {
            console.warn('âš ï¸ PDF download: Skipping wall with corrupted coordinates from mapData');
            return false;
          }
          return true;
        });
        wallsData = [...wallsData, ...mapWalls];
      }
      
      // Method 2: Check direct walls array (floorPlanData.walls)
      if (floorPlanData.walls && Array.isArray(floorPlanData.walls)) {
        const directWalls = floorPlanData.walls.filter(wall => {
          const x1 = wall.x1 || 0;
          const y1 = wall.y1 || 0;
          const x2 = wall.x2 || 0;
          const y2 = wall.y2 || 0;
          if (Math.abs(x1) > maxReasonableCoord || Math.abs(y1) > maxReasonableCoord ||
              Math.abs(x2) > maxReasonableCoord || Math.abs(y2) > maxReasonableCoord) {
            console.warn('âš ï¸ PDF download: Skipping wall with corrupted coordinates from walls array');
            return false;
          }
          return true;
        });
        wallsData = [...wallsData, ...directWalls];
      }
      
      // Draw walls
      wallsData.forEach(wall => {
        drawWallRect(sx(wall.x1 || 0), sy(wall.y1 || 0), sx(wall.x2 || 0), sy(wall.y2 || 0), innerWallThickness);
      });
      
      // Draw doors (as arcs - architectural style) - check multiple data sources like KonvaFloorPlan
      let doorsData = [];
      
      // Method 1: Check mapData for doors
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData)) {
        const mapDoors = floorPlanData.mapData.filter(item => {
          if (item.type !== 'Door') return false;
          // VALIDATION: Skip doors with corrupted coordinates
          const x1 = item.x1 || 0;
          const y1 = item.y1 || 0;
          const x2 = item.x2 || 0;
          const y2 = item.y2 || 0;
          if (Math.abs(x1) > maxReasonableCoord || Math.abs(y1) > maxReasonableCoord ||
              Math.abs(x2) > maxReasonableCoord || Math.abs(y2) > maxReasonableCoord) {
            console.warn('âš ï¸ PDF download: Skipping door with corrupted coordinates from mapData');
            return false;
          }
          return true;
        });
        doorsData = [...doorsData, ...mapDoors];
      }
      
      // Method 2: Check direct doors array (floorPlanData.doors)
      if (floorPlanData.doors && Array.isArray(floorPlanData.doors)) {
        const directDoors = floorPlanData.doors.filter(door => {
          const x1 = door.x1 || 0;
          const y1 = door.y1 || 0;
          const x2 = door.x2 || 0;
          const y2 = door.y2 || 0;
          if (Math.abs(x1) > maxReasonableCoord || Math.abs(y1) > maxReasonableCoord ||
              Math.abs(x2) > maxReasonableCoord || Math.abs(y2) > maxReasonableCoord) {
            console.warn('âš ï¸ PDF download: Skipping door with corrupted coordinates from doors array');
            return false;
          }
          return true;
        });
        doorsData = [...doorsData, ...directDoors];
      }
      
      // Method 3: Auto-generate doors on room walls if no doors found (same as KonvaFloorPlan)
      if (doorsData.length === 0 && floorPlanData.rooms && floorPlanData.rooms.length > 0) {
        console.log('ðŸ“‹ PDF: Auto-generating doors for rooms (no doors in data)');
        floorPlanData.rooms.forEach((room, index) => {
          const roomX = room.x || 0;
          const roomY = room.y || 0;
          const roomWidth = room.width || 100;
          const roomHeight = room.height || 100;
          
          // Add door to the bottom edge of each room (centered)
          const doorWidth = Math.min(80, roomWidth * 0.3);
          const doorX = roomX + (roomWidth - doorWidth) / 2;
          const doorY = roomY + roomHeight;
          
          doorsData.push({
            id: `generated-door-${index}`,
            x1: doorX,
            y1: doorY,
            x2: doorX + doorWidth,
            y2: doorY,
            type: 'Door'
          });
        });
      }
      
      // Draw doors
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      
      doorsData.forEach(door => {
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
        
        // Draw small hinge circle
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x1, y1, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw windows (as rectangles with white fill) - check multiple data sources like KonvaFloorPlan
      let windowsData = [];
      
      // Method 1: Check mapData for windows
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData)) {
        const mapWindows = floorPlanData.mapData.filter(item => {
          if (item.type !== 'Window') return false;
          // VALIDATION: Skip windows with corrupted coordinates
          const x1 = item.x1 || 0;
          const y1 = item.y1 || 0;
          const x2 = item.x2 || 0;
          const y2 = item.y2 || 0;
          if (Math.abs(x1) > maxReasonableCoord || Math.abs(y1) > maxReasonableCoord ||
              Math.abs(x2) > maxReasonableCoord || Math.abs(y2) > maxReasonableCoord) {
            console.warn('âš ï¸ PDF download: Skipping window with corrupted coordinates from mapData');
            return false;
          }
          return true;
        });
        windowsData = [...windowsData, ...mapWindows];
      }
      
      // Method 2: Check direct windows array (floorPlanData.windows)
      if (floorPlanData.windows && Array.isArray(floorPlanData.windows)) {
        const directWindows = floorPlanData.windows.filter(window => {
          const x1 = window.x1 || 0;
          const y1 = window.y1 || 0;
          const x2 = window.x2 || 0;
          const y2 = window.y2 || 0;
          if (Math.abs(x1) > maxReasonableCoord || Math.abs(y1) > maxReasonableCoord ||
              Math.abs(x2) > maxReasonableCoord || Math.abs(y2) > maxReasonableCoord) {
            console.warn('âš ï¸ PDF download: Skipping window with corrupted coordinates from windows array');
            return false;
          }
          return true;
        });
        windowsData = [...windowsData, ...directWindows];
      }
      
      // Draw windows
      windowsData.forEach(window => {
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
      
      // Draw stairs - check multiple data sources
      let stairsData = [];
      
      // Method 1: Check mapData for stairs
      if (floorPlanData.mapData && Array.isArray(floorPlanData.mapData)) {
        const mapStairs = floorPlanData.mapData.filter(item => 
          item.type === 'Stairs' || item.type === 'stairs'
        );
        stairsData = [...stairsData, ...mapStairs];
      }
      
      // Method 2: Check direct stairs array (floorPlanData.stairs)
      if (floorPlanData.stairs && Array.isArray(floorPlanData.stairs)) {
        stairsData = [...stairsData, ...floorPlanData.stairs];
      }
      
      // Draw stairs
      stairsData.forEach(stair => {
        const stairX = sx(stair.x || 0);
        const stairY = sy(stair.y || 0);
        const stairWidth = (stair.width || 80) * scale;
        const stairHeight = (stair.height || 120) * scale;
        const direction = stair.direction || 'up';
        
        // Draw stairs background rectangle (light gray fill)
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(stairX, stairY, stairWidth, stairHeight);
        
        // Draw stairs border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(stairX, stairY, stairWidth, stairHeight);
        
        // Draw stair steps based on direction
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        const numSteps = 8;
        const isVertical = direction === 'up' || direction === 'down';
        
        for (let i = 1; i <= numSteps; i++) {
          ctx.beginPath();
          if (isVertical) {
            // Horizontal lines for up/down stairs
            const stepY = stairY + (i * stairHeight / (numSteps + 1));
            ctx.moveTo(stairX, stepY);
            ctx.lineTo(stairX + stairWidth, stepY);
          } else {
            // Vertical lines for left/right stairs
            const stepX = stairX + (i * stairWidth / (numSteps + 1));
            ctx.moveTo(stepX, stairY);
            ctx.lineTo(stepX, stairY + stairHeight);
          }
          ctx.stroke();
        }
        
        // Draw direction arrow - handle all four directions
        let arrowText;
        switch (direction) {
          case 'up':
            arrowText = 'â†‘';
            break;
          case 'down':
            arrowText = 'â†“';
            break;
          case 'left':
            arrowText = 'â†';
            break;
          case 'right':
            arrowText = 'â†’';
            break;
          default:
            arrowText = 'â†‘';
        }
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(arrowText, stairX + stairWidth / 2, stairY + stairHeight / 2 - 10);
        
        // Draw STAIRS label
        ctx.font = 'bold 10px Arial';
        ctx.fillText('STAIRS', stairX + stairWidth / 2, stairY + stairHeight / 2 + 10);
      });
      
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
  }, [floorPlanData]);

  // Save floor plan
  const handleSave = async () => {
    if (!floorPlanData || isSaving) return;

    // Determine save type and name handling
    const currentName = floorPlanData.project_name || `Floor Plan ${new Date().toLocaleDateString()}`;
    
    let projectName;
    if (hasUnsavedChanges && !isFirstSave) {
      // Show confirmation dialog for changes to existing floorplan
      const confirmMessage = `Do you want to save changes to "${currentName}"?`;
      const shouldSave = window.confirm(confirmMessage);
      if (!shouldSave) return;
      projectName = currentName; // Keep existing name for updates
    } else {
      // Prompt for name on first save or when saving without changes
      projectName = prompt(
        isFirstSave ? 'Enter a name for your floor plan:' : 'Save floor plan as:', 
        currentName
      );
      
      // If user cancels, don't save
      if (projectName === null) return;
    }
    
    // If user enters empty name, use default
    const finalName = projectName.trim() || currentName;

    try {
      // Get user info from localStorage or auth context
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !user.id) {
        alert('User not authenticated. Please log in again.');
        setIsSaving(false);
        return;
      }

      // Prepare comprehensive floor plan data for saving
      const saveData = {
        floorplan_id: floorPlanData._id || floorPlanData.id || floorPlanData.floorplan_id,
        user_id: user.id,
        project_name: finalName,
        floor_plan_data: {
          rooms: floorPlanData.rooms || floorPlanData.room_data || [],
          mapData: floorPlanData.mapData || [],
          walls: floorPlanData.walls || [],
          doors: floorPlanData.doors || [],
          windows: floorPlanData.windows || [],
          plotDimensions: floorPlanData.plotDimensions || { width: 1000, height: 1000 },
          plotWidth: floorPlanData.plotWidth || 1000,
          plotHeight: floorPlanData.plotHeight || 1000,
          actualLength: floorPlanData.actualLength || 55,
          actualWidth: floorPlanData.actualWidth || 25,
          totalPlotArea: floorPlanData.totalPlotArea,
          allocatedArea: floorPlanData.allocatedArea,
          utilizationPercentage: floorPlanData.utilizationPercentage,
        },
        room_data: floorPlanData.rooms || floorPlanData.room_data || [],
        constraints: floorPlanData.constraints || {},
        dimensions: floorPlanData.dimensions || floorPlanData.plotDimensions || { width: 1000, height: 1000 },
        width: floorPlanData.plotWidth || floorPlanData.dimensions?.width || 1000,
        height: floorPlanData.plotHeight || floorPlanData.dimensions?.height || 1000
      };
      
      // DEBUG: Log what coordinates are actually being saved
      console.log('ðŸ’¾ Rooms data being saved (should be backend coords 0-1000):');
      (floorPlanData.rooms || []).forEach((room, index) => {
        if (index < 3) { // Log first 3 rooms
          console.log(`   ${room.name || room.type}: x=${room.x?.toFixed(1)}, y=${room.y?.toFixed(1)}, w=${room.width?.toFixed(1)}, h=${room.height?.toFixed(1)}`);
          
          // VALIDATION: Check if coordinates look like Konva coords (> 1000)
          if (room.x > 1500 || room.y > 1500 || room.width > 1500 || room.height > 1500) {
            console.error(`   âŒ ERROR: Room ${room.name || room.type} has KONVA coordinates, not backend coordinates!`);
            console.error(`      This will cause double-conversion on reload.`);
          }
        }
      });
      
      const stairsBeingSaved = (floorPlanData.mapData || []).filter(item => item.type === 'Stairs' || item.type === 'stairs');
      console.log(`ðŸ’¾ Stairs data being saved: ${stairsBeingSaved.length} stairs`);
      stairsBeingSaved.forEach((stair, index) => {
        console.log(`   Stairs ${stair.id}: x=${stair.x?.toFixed(1)}, y=${stair.y?.toFixed(1)}, w=${stair.width?.toFixed(1)}, h=${stair.height?.toFixed(1)}`);
        
        // VALIDATION: Check if coordinates look like Konva coords
        if (stair.x > 1500 || stair.y > 1500 || stair.width > 1500 || stair.height > 1500) {
          console.error(`   âŒ ERROR: Stairs ${stair.id} has KONVA coordinates, not backend coordinates!`);
        }
      });

      console.log('ðŸ’¾ Preparing to save floor plan:', {
        isFirstSave,
        hasId: !!floorPlanData._id,
        roomCount: saveData.room_data?.length || 0,
        mapDataCount: saveData.floor_plan_data?.mapData?.length || 0,
        stairsCount: saveData.floor_plan_data?.mapData?.filter(item => item.type === 'Stairs' || item.type === 'stairs').length || 0,
        doorsCount: saveData.floor_plan_data?.mapData?.filter(item => item.type === 'Door').length || 0,
        windowsCount: saveData.floor_plan_data?.mapData?.filter(item => item.type === 'Window').length || 0,
        plotWidth: saveData.floor_plan_data?.plotWidth,
        plotHeight: saveData.floor_plan_data?.plotHeight,
        actualLength: saveData.floor_plan_data?.actualLength,
        actualWidth: saveData.floor_plan_data?.actualWidth,
        projectName: finalName
      });
      
      // CRITICAL VALIDATION: Ensure we're not losing dimension data
      if (!saveData.floor_plan_data.plotWidth || !saveData.floor_plan_data.plotHeight) {
        console.error('âŒ ERROR: plotWidth or plotHeight is missing from save data!');
      }
      if (!saveData.floor_plan_data.actualLength || !saveData.floor_plan_data.actualWidth) {
        console.error('âŒ ERROR: actualLength or actualWidth is missing from save data!');
      }
      
      // Debug: Log stairs data specifically
      const stairsInMapData = saveData.floor_plan_data?.mapData?.filter(item => 
        item.type === 'Stairs' || item.type === 'stairs'
      );
      if (stairsInMapData && stairsInMapData.length > 0) {
        console.log('ðŸªœ Stairs being saved:', stairsInMapData);
      } else {
        console.warn('âš ï¸ No stairs found in mapData to save');
      }

      // Determine API endpoint based on whether this is first save or update
      const apiEndpoint = (floorPlanData._id && !isFirstSave) ? '/api/floorplan/update' : '/api/floorplan/save';
      const method = (floorPlanData._id && !isFirstSave) ? 'PUT' : 'POST';
      
      console.log(`ðŸ“¤ ${isFirstSave ? 'Creating new' : 'Updating existing'} floor plan via ${apiEndpoint}`);
      
      // Prevent multiple concurrent saves
      setIsSaving(true);
      
      // Send floor plan data to backend
      const response = await fetch(apiEndpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      console.log('Save result:', result);

      if (response.ok && result.success) {
        setHasUnsavedChanges(false);
        setIsFirstSave(false);
        
        // Update the project name and ID in local state
        setFloorPlanData(prev => ({
          ...prev,
          project_name: finalName,
          _id: result.floorplan_id || prev._id
        }));
        
        // Show appropriate success message
        const message = hasUnsavedChanges && !isFirstSave 
          ? `Changes saved to "${finalName}"!` 
          : `Floor plan "${finalName}" saved successfully!`;
        alert(message);
        
        console.log('âœ… Floor plan saved successfully:', {
          id: result.floorplan_id,
          name: finalName,
          isUpdate: !isFirstSave
        });
      } else {
        throw new Error(result.error || 'Failed to save floor plan');
      }
    } catch (error) {
      console.error('Error saving floor plan:', error);
      alert(`Failed to save floor plan: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to go back?'
      );
      if (!confirm) return;
    }

    // Rebuild the allPlans array with the edited plan substituted in
    const allPlans   = location.state?.allPlans || [];
    const planIndex  = location.state?.currentPlanIndex ?? 0;
    let returnedPlans = allPlans.length > 0 ? [...allPlans] : [];
    if (floorPlanData) {
      if (returnedPlans.length > planIndex) {
        returnedPlans[planIndex] = floorPlanData;
      } else {
        returnedPlans = [floorPlanData];
      }
    }

    navigate('/floor-plan/generate', {
      state: {
        // Restore generator state
        returnedPlans,
        returnedPlanIndex: planIndex,
        // Preserve original navigation state so compliance rules etc. still work
        ...location.state
      }
    });
  };

  // Export floor plan
  const handleExport = () => {
    if (!floorPlanData) return;
    
    const dataStr = JSON.stringify(floorPlanData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `floor-plan-${floorPlanData.id || 'custom'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!floorPlanData) {
    return (
      <div className="min-h-screen bg-[#2F3D57] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED7600] mx-auto mb-4"></div>
          <p className="text-white">Loading floor plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2F3D57] text-white">
      {/* Header */}
      <div className="bg-[#1e2a3a] shadow-lg border-b border-[#ED7600]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-3 py-2 border border-[#ED7600] shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-transparent hover:bg-[#ED7600] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED7600] transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Generator
              </button>
              <div className="h-6 w-px bg-[#ED7600]"></div>
              <h1 className="text-xl font-semibold text-white">Floor Plan Customization</h1>
              {hasUnsavedChanges && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ED7600] text-white">
                  Unsaved Changes
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#2F3D57] rounded-lg p-1 border border-[#ED7600]">
                <button
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === '2d'
                      ? 'bg-[#ED7600] text-white shadow-sm'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  ðŸ“ 2D Edit
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === '3d'
                      ? 'bg-[#ED7600] text-white shadow-sm'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  ðŸ—ï¸ 3D View
                </button>
              </div>
              
              <button
                onClick={downloadPDF}
                className="inline-flex items-center px-4 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-[#ED7600] shadow-sm text-sm font-medium rounded-md text-white bg-transparent hover:bg-[#ED7600] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED7600] transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED7600] transition-colors ${
                  !isSaving
                    ? hasUnsavedChanges 
                      ? 'bg-[#ED7600] hover:bg-[#D56900]' 
                      : 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {hasUnsavedChanges ? 'Save Changes' : 'Save Floorplan'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-2 py-1 max-w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-1">
            {viewMode === '2d' && (
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h2 className="text-xs font-semibold text-slate-900">
                    Interactive Floor Plan Editor
                  </h2>
                </div>
              
                <div className="flex items-center space-x-3 text-xs text-slate-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-500 rounded mr-1"></div>
                    <span>25px Grid</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded mr-1"></div>
                    <span>Selected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Floor Plan Canvas */}
            <div className="w-full">
              {/* 2D View */}
              <div style={{ display: viewMode === '2d' ? 'block' : 'none', height: 'calc(100vh - 150px)' }}>
                <KonvaFloorPlan
                  ref={stageRef}
                  floorPlanData={floorPlanData}
                  width={window.innerWidth - 280}
                  height={window.innerHeight - 180}
                  isEditable={true}
                  showWalls={false}
                  setbacks={location.state?.setbacks || null}
                  onRoomUpdate={handleRoomUpdate}
                  onRoomsChange={handleRoomsChange}
                  onWallsChange={handleWallsChange}
                  onDoorsChange={handleDoorsChange}
                  onWindowsChange={handleWindowsChange}
                  onStairsChange={handleStairsChange}
                />
              </div>
              {/* 3D View - kept mounted to avoid WebGL shader recompilation errors */}
              <div 
                className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white"
                style={{ display: viewMode === '3d' ? 'flex' : 'none', height: 'calc(100vh - 120px)' }}
              >
                <React.Suspense 
                  fallback={
                    <div className="flex items-center justify-center h-full bg-slate-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading 3D Viewer...</p>
                      </div>
                    </div>
                  }
                >
                  <FloorPlan3D 
                    floorPlanData={floorPlanData}
                    className="w-full h-full"
                    isVisible={viewMode === '3d'}
                    setbacks={location.state?.setbacks || null}
                  />
                </React.Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanCustomization;
