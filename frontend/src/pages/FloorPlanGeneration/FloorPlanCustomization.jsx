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
          <div className="text-6xl mb-4">🏗️</div>
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
        console.log('⏭️ Already initialized, skipping');
        return;
      }
      
      if (location.state?.floorPlan) {
        const floorPlan = location.state.floorPlan;
        
        // Check if floor plan has database ID to determine if it's a new or existing floorplan
        if (!floorPlan._id) {
          console.log('🆕 New floor plan from generator (no database ID)');
          console.log('Floor plan data:', floorPlan);
          setFloorPlanData(floorPlan);
          setIsFirstSave(true); // This is a new floorplan
        } else {
          console.log('✅ Floor plan already has ID:', floorPlan._id || floorPlan.id);
          setFloorPlanData(floorPlan);
          setIsFirstSave(false); // This is an existing floorplan
        }
        
        // Mark as initialized to prevent re-processing
        setIsInitialized(true);
      } else {
        console.log('❌ No floor plan in navigation state');
        setIsInitialized(true); // Mark as initialized even if no data
        // If no floor plan data, redirect back to generator
        navigate('/floor-plan/generate', { replace: true });
      }
    };

    initializeFloorPlan();
  }, [location.state, navigate]);

  // Handle room updates
  const handleRoomUpdate = useCallback((roomId, newProperties) => {
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const updatedData = { ...prevData };
      updatedData.rooms = updatedData.rooms.map(room => 
        room.id === roomId || `room-${room.id}` === roomId || room.tag === roomId
          ? { ...room, ...newProperties }
          : room
      );
      
      return updatedData;
    });
    
    setHasUnsavedChanges(true);
  }, []);

  // Handle rooms change (add/remove)
  const handleRoomsChange = useCallback((updatedRooms) => {
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      // Convert Konva rooms back to backend format
      const backendRooms = updatedRooms.map(room => {
        // For newly created rooms, convert Konva coordinates back to backend coordinates
        if (room.id && (room.id.toString().startsWith('new-room-') || room.id.toString().startsWith('created-room-'))) {
          const margin = 40;
          const scale = room.scale || 1;
          
          return {
            id: room.id,
            x: (room.x - margin) / scale,
            y: (room.y - margin) / scale,
            width: room.width / scale,
            height: room.height / scale,
            type: room.type,
            tag: room.tag,
            name: room.name
          };
        }
        
        // For existing rooms from backend, use original coordinates
        return {
          id: room.id,
          x: room.originalX !== undefined ? room.originalX : room.x,
          y: room.originalY !== undefined ? room.originalY : room.y,
          width: room.originalWidth !== undefined ? room.originalWidth : room.width,
          height: room.originalHeight !== undefined ? room.originalHeight : room.height,
          type: room.type,
          tag: room.tag,
          name: room.name
        };
      });
      
      return {
        ...prevData,
        rooms: backendRooms
      };
    });
    
    setHasUnsavedChanges(true);
  }, []);

  // Handle walls change (add/remove/resize)
  const handleWallsChange = useCallback((updatedWalls) => {
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const margin = 40;
      const plotWidth = 1000;
      const plotHeight = 1000;
      const scaleX = (800 - margin * 2) / plotWidth;
      const scaleY = (600 - margin * 2) / plotHeight;
      const scale = Math.min(scaleX, scaleY);
      
      // Convert ALL Konva walls to backend format
      const backendWalls = updatedWalls.map(wall => {
        return {
          type: 'Wall',
          id: wall.id,
          x1: (wall.points[0] - margin) / scale,
          y1: (wall.points[1] - margin) / scale,
          x2: (wall.points[2] - margin) / scale,
          y2: (wall.points[3] - margin) / scale
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
  }, []);

  // Handle doors change (add/remove)
  const handleDoorsChange = useCallback((updatedDoors) => {
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const margin = 40;
      const plotWidth = 1000;
      const plotHeight = 1000;
      const scaleX = (800 - margin * 2) / plotWidth;
      const scaleY = (600 - margin * 2) / plotHeight;
      const scale = Math.min(scaleX, scaleY);
      
      // Convert ALL Konva doors to backend format (not just manually created ones)
      const backendDoors = updatedDoors.map(door => {
        return {
          type: 'Door',
          id: door.id, // Keep the ID so we can track it
          x1: (door.points[0] - margin) / scale,
          y1: (door.points[1] - margin) / scale,
          x2: (door.points[2] - margin) / scale,
          y2: (door.points[3] - margin) / scale
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
  }, []);

  // Handle window changes from Konva editor
  const handleWindowsChange = useCallback((updatedWindows) => {
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const margin = 40;
      const plotWidth = 1000;
      const plotHeight = 1000;
      const scaleX = (800 - margin * 2) / plotWidth;
      const scaleY = (600 - margin * 2) / plotHeight;
      const scale = Math.min(scaleX, scaleY);
      
      // Convert ALL Konva windows to backend format
      const backendWindows = updatedWindows.map(window => {
        return {
          type: 'Window',
          id: window.id,
          x1: (window.points[0] - margin) / scale,
          y1: (window.points[1] - margin) / scale,
          x2: (window.points[2] - margin) / scale,
          y2: (window.points[3] - margin) / scale
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
  }, []);

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
          plotDimensions: floorPlanData.plotDimensions || { width: 1000, height: 1000 }
        },
        room_data: floorPlanData.rooms || floorPlanData.room_data || [], // Include room data for room count
        constraints: floorPlanData.constraints || {},
        dimensions: floorPlanData.dimensions || floorPlanData.plotDimensions || { width: 1000, height: 1000 }
      };

      console.log('💾 Preparing to save floor plan:', {
        isFirstSave,
        hasId: !!floorPlanData._id,
        roomCount: saveData.room_data?.length || 0,
        projectName: finalName
      });

      // Determine API endpoint based on whether this is first save or update
      const apiEndpoint = (floorPlanData._id && !isFirstSave) ? '/api/floorplan/update' : '/api/floorplan/save';
      const method = (floorPlanData._id && !isFirstSave) ? 'PUT' : 'POST';
      
      console.log(`📤 ${isFirstSave ? 'Creating new' : 'Updating existing'} floor plan via ${apiEndpoint}`);
      
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
        
        console.log('✅ Floor plan saved successfully:', {
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
    navigate('/floor-plan/generate');
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
          <div className="flex items-center justify-between h-16">
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
                  📐 2D Edit
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === '3d'
                      ? 'bg-[#ED7600] text-white shadow-sm'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  🏗️ 3D View
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {viewMode === '2d' ? 'Interactive Floor Plan Editor' : '3D Floor Plan Viewer'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {viewMode === '2d' 
                    ? 'Drag rooms to reposition them, drag corners to resize, or click to select and view details.'
                    : 'Experience your floor plan in 3D with realistic lighting, furniture, and walk-through mode.'
                  }
                </p>
              </div>
              
              {viewMode === '2d' && (
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
                    <span>25px Grid</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                    <span>Selected Room</span>
                  </div>
                </div>
              )}
            </div>

            {/* Floor Plan Canvas */}
            <div className="flex justify-center">
              {/* 2D View */}
              <div style={{ display: viewMode === '2d' ? 'block' : 'none' }}>
                <KonvaFloorPlan
                  ref={stageRef}
                  floorPlanData={floorPlanData}
                  width={800}
                  height={600}
                  isEditable={true}
                  onRoomUpdate={handleRoomUpdate}
                  onRoomsChange={handleRoomsChange}
                  onWallsChange={handleWallsChange}
                  onDoorsChange={handleDoorsChange}
                  onWindowsChange={handleWindowsChange}
                />
              </div>
              {/* 3D View - kept mounted to avoid WebGL shader recompilation errors */}
              <div 
                className="w-full h-150 rounded-xl overflow-hidden border border-gray-200"
                style={{ display: viewMode === '3d' ? 'block' : 'none' }}
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
                  />
                </React.Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Panel */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white font-bold">
              {viewMode === '2d' ? '📐' : '🏗️'}
            </span>
            {viewMode === '2d' ? 'Customization Instructions' : '3D Viewer Features'}
          </h3>
          
          {viewMode === '2d' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <span className="mr-2">🔄</span> Moving Rooms
                </h4>
                <ul className="text-slate-600 space-y-1">
                  <li>• Click and drag any room to move it</li>
                  <li>• Rooms snap to a 25px grid for alignment</li>
                  <li>• Rooms are constrained within plot boundaries</li>
                </ul>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <span className="mr-2">🔧</span> Resizing Rooms
                </h4>
                <ul className="text-slate-600 space-y-1">
                  <li>• Select a room by clicking on it</li>
                  <li>• Drag the orange handles to resize</li>
                  <li>• Minimum room size is enforced</li>
                </ul>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <span className="mr-2">💾</span> Saving Changes
                </h4>
                <ul className="text-slate-600 space-y-1">
                  <li>• Changes are tracked automatically</li>
                  <li>• Click "Save Changes" to persist updates</li>
                  <li>• Export your design as JSON file</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <span className="mr-2">🪟</span> 3D Features
                </h4>
                <ul className="text-slate-600 space-y-1">
                  <li>• Realistic windows with light yellow glass</li>
                  <li>• Interactive doors that open/close on click</li>
                  <li>• Soft shadows and realistic lighting</li>
                  <li>• Color-coded rooms for easy identification</li>
                </ul>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <span className="mr-2">🕹️</span> Controls
                </h4>
                <ul className="text-slate-600 space-y-1">
                  <li>• <strong className="text-slate-900">Overview Mode:</strong> Drag to orbit, scroll to zoom</li>
                  <li>• <strong className="text-slate-900">Walk Mode:</strong> WASD keys + mouse look</li>
                  <li>• Switch between modes with buttons</li>
                  <li>• City skybox environment for realism</li>
                </ul>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <span className="mr-2">📦</span> Export Options
                </h4>
                <ul className="text-slate-600 space-y-1">
                  <li>• Take screenshots of your 3D model</li>
                  <li>• Share your design with others</li>
                  <li>• <span className="text-slate-900">🪑</span> Furniture automatically placed by room type</li>
                  <li>• Perfect for design presentations</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanCustomization;
