import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import KonvaFloorPlan from '../../components/FloorPlan/KonvaFloorPlan';


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
  const [floorPlanData, setFloorPlanData] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  // Authentication helper
  const getAuthData = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      return { token, user };
    } catch (error) {
      console.error('Error parsing auth data:', error);
      return { token: null, user: null };
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const { token } = getAuthData();
    setIsAuthenticated(!!token);
  }, [getAuthData]);

  // Get floor plan data from navigation state or localStorage
  useEffect(() => {
    if (location.state?.floorPlan) {
      // Data from navigation
      const floorPlan = location.state.floorPlan;
      setFloorPlanData(floorPlan);
      
      // Save to localStorage for persistence across refreshes
      localStorage.setItem('currentFloorPlan', JSON.stringify(floorPlan));
      
      // Initialize floor plan data
      const initialDataStr = JSON.stringify({
        rooms: floorPlan.rooms,
        walls: floorPlan.walls,
        doors: floorPlan.doors,
        plotDimensions: floorPlan.plotDimensions
      });
    } else {
      // Try to load from localStorage on refresh
      const savedFloorPlan = localStorage.getItem('currentFloorPlan');
      if (savedFloorPlan) {
        try {
          const floorPlan = JSON.parse(savedFloorPlan);
          console.log('Loaded floor plan from localStorage after refresh');
          setFloorPlanData(floorPlan);
          
          // Floor plan loaded from localStorage
          const initialDataStr = JSON.stringify({
            rooms: floorPlan.rooms || [],
            walls: floorPlan.walls || [],
            doors: floorPlan.doors || [],
            plotDimensions: floorPlan.plotDimensions || {}
          });
        } catch (error) {
          console.error('Error parsing saved floor plan:', error);
          navigate('/floor-plan/generate', { replace: true });
        }
      } else {
        // No data available, redirect to generator
        navigate('/floor-plan/generate', { replace: true });
      }
    }
  }, [location.state, navigate]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save function with debouncing
  const autoSave = useCallback(async (data) => {
    if (!data) return;

    try {
      setIsAutoSaving(true);
      
      // Get authentication data
      const { token, user } = getAuthData();
      
      // If no token, save locally only
      if (!token || !user) {
        console.log('No authentication token found, saving locally only');
        localStorage.setItem('currentFloorPlan', JSON.stringify(data));
        setIsAutoSaving(false);
        return;
      }

      // Check if floor plan has an ID (already saved to backend)
      const floorplanId = data.id || data._id;
      
      if (floorplanId) {
        // Update existing floor plan
        const response = await fetch('http://localhost:5000/api/floorplan/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            floorplan_id: floorplanId,
            user_id: user.id,
            floor_plan_data: {
              rooms: data.rooms || [],
              walls: data.walls || [],
              doors: data.doors || [],
              plotDimensions: data.plotDimensions || {},
              mapData: data.mapData || []
            }
          }),
        });

        if (response.ok) {
          setHasUnsavedChanges(false);
          localStorage.setItem('currentFloorPlan', JSON.stringify(data));
          console.log('✅ Floor plan auto-saved to server');
        } else {
          console.warn('Auto-save to server failed, saved locally');
          localStorage.setItem('currentFloorPlan', JSON.stringify(data));
        }
      } else {
        // New floor plan not yet saved - just save locally for now
        localStorage.setItem('currentFloorPlan', JSON.stringify(data));
        console.log('New floor plan cached locally (use Save Changes button to persist)');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      
      // Provide user-friendly error messages based on error type
      if (error.message.includes('Floor plan ID')) {
        console.warn('Auto-save failed: Invalid floor plan data.');
      } else if (error.message.includes('fetch')) {
        console.warn('Auto-save failed: Network error. Data saved locally.');
        // Save locally as fallback
        try {
          localStorage.setItem(`floorplan_backup_${data.id}`, JSON.stringify({
            ...data,
            savedAt: new Date().toISOString(),
            offline: true
          }));
        } catch (localError) {
          console.error('Failed to save locally:', localError);
        }
      } else {
        console.warn('Auto-save failed: Server error.');
      }
      // Don't show alerts for auto-save errors to avoid disrupting UX
    } finally {
      setIsAutoSaving(false);
    }
  }, []);

  // Debounced auto-save trigger
  const triggerAutoSave = useCallback((data) => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (2 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(data);
    }, 2000);
  }, [autoSave]);

  // Handle room updates with auto-save
  const handleRoomUpdate = useCallback((roomId, newProperties) => {
    setFloorPlanData(prevData => {
      if (!prevData) return prevData;
      
      const updatedData = { ...prevData };
      updatedData.rooms = updatedData.rooms.map(room => 
        room.id === roomId || `room-${room.id}` === roomId || room.tag === roomId
          ? { ...room, ...newProperties }
          : room
      );
      
      // Trigger auto-save with debouncing
      triggerAutoSave(updatedData);
      
      return updatedData;
    });
    
    setHasUnsavedChanges(true);
  }, [triggerAutoSave]);

  // Handle any floor plan data updates (walls, doors, etc.)
  const handleFloorPlanUpdate = useCallback((updatedData) => {
    console.log('📥 Received floor plan update:', {
      walls: updatedData?.walls?.length || 0,
      mapData: updatedData?.mapData?.length || 0,
      rooms: updatedData?.rooms?.length || 0,
      wallsData: updatedData?.walls
    });
    
    setFloorPlanData(prevData => {
      if (!prevData) {
        // First time setting data
        localStorage.setItem('currentFloorPlan', JSON.stringify(updatedData));
        setTimeout(() => {
          setHasUnsavedChanges(true);
          triggerAutoSave(updatedData);
        }, 0);
        return updatedData;
      }
      
      // Only update if there are actual changes to prevent feedback loops
      // However, always update if mapData changed (for 3D view updates)
      const mapDataChanged = JSON.stringify(prevData.mapData) !== JSON.stringify(updatedData.mapData);
      
      const hasChanges = 
        JSON.stringify(prevData.rooms) !== JSON.stringify(updatedData.rooms) ||
        JSON.stringify(prevData.walls) !== JSON.stringify(updatedData.walls) ||
        JSON.stringify(prevData.doors) !== JSON.stringify(updatedData.doors) ||
        mapDataChanged;
      
      if (!hasChanges) {
        console.log('No actual changes detected, skipping update to prevent feedback loop');
        console.log('Previous walls:', prevData.walls?.length, 'Updated walls:', updatedData.walls?.length);
        console.log('Previous mapData:', prevData.mapData?.length, 'Updated mapData:', updatedData.mapData?.length);
        return prevData;
      }
      
      // Force update for 3D view when mapData changes
      if (mapDataChanged) {
        console.log('🔄 MapData changed - forcing 3D view update');
      }
      
      console.log('Floor plan data updated with changes');
      
      // Save to localStorage for persistence
      localStorage.setItem('currentFloorPlan', JSON.stringify(updatedData));
      
      // Use setTimeout to handle side effects after state update
      setTimeout(() => {
        setHasUnsavedChanges(true);
        triggerAutoSave(updatedData);
      }, 0);
      
      return updatedData;
    });
  }, [triggerAutoSave]);

  // Save floor plan
  const handleSave = async () => {
    if (!floorPlanData) return;

    setIsSaving(true);
    try {
      // Get authentication data
      const { token, user } = getAuthData();
      
      if (!token || !user) {
        alert('Please log in to save your floor plan.');
        setIsSaving(false);
        return;
      }

      // Check if this is a new floor plan (no ID yet) or an existing one
      const isNewFloorPlan = !floorPlanData.id || !floorPlanData._id;
      
      if (isNewFloorPlan) {
        // Save new floor plan
        const saveData = {
          user_id: user.id,
          project_name: floorPlanData.projectName || `Floor Plan - ${new Date().toLocaleDateString()}`,
          floor_plan_data: {
            rooms: floorPlanData.rooms || [],
            walls: floorPlanData.walls || [],
            doors: floorPlanData.doors || [],
            plotDimensions: floorPlanData.plotDimensions || {},
            mapData: floorPlanData.mapData || []
          },
          room_data: floorPlanData.rooms || [],
          constraints: floorPlanData.constraints || {},
          width: floorPlanData.plotDimensions?.width || 1000,
          height: floorPlanData.plotDimensions?.height || 1000,
          tags: []
        };

        const response = await fetch('http://localhost:5000/api/floorplan/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(saveData),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Update floor plan data with the new ID
          const updatedFloorPlan = {
            ...floorPlanData,
            id: result.floorplan_id,
            _id: result.floorplan_id
          };
          
          setFloorPlanData(updatedFloorPlan);
          localStorage.setItem('currentFloorPlan', JSON.stringify(updatedFloorPlan));
          setHasUnsavedChanges(false);
          
          alert('✅ Floor plan saved successfully! You can view it in "My Progress".');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save floor plan');
        }
      } else {
        // Update existing floor plan
        const response = await fetch('http://localhost:5000/api/floorplan/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            floorplan_id: floorPlanData.id || floorPlanData._id,
            user_id: user.id,
            floor_plan_data: {
              rooms: floorPlanData.rooms || [],
              walls: floorPlanData.walls || [],
              doors: floorPlanData.doors || [],
              plotDimensions: floorPlanData.plotDimensions || {},
              mapData: floorPlanData.mapData || []
            }
          }),
        });

        if (response.ok) {
          setHasUnsavedChanges(false);
          localStorage.setItem('currentFloorPlan', JSON.stringify(floorPlanData));
          alert('✅ Floor plan updated successfully!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update floor plan');
        }
      }
    } catch (error) {
      console.error('Error saving floor plan:', error);
      alert(`❌ Failed to save floor plan: ${error.message}`);
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
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-semibold text-white">Floor Plan Customization</h1>
              <div className="h-6 w-px bg-[#ED7600]"></div>
              <button
                onClick={handleBack}
                className="inline-flex items-center px-3 py-2 border border-[#ED7600] shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-transparent hover:bg-[#ED7600] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED7600] transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Generator
              </button>
              
              {/* Save Status Indicator */}
              {isAutoSaving && (
                <div className="flex items-center text-sm text-blue-300">
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Auto-saving...
                </div>
              )}
              
              {!isAutoSaving && !hasUnsavedChanges && floorPlanData?.id && (
                <div className="flex items-center text-sm text-green-300">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All changes saved
                </div>
              )}
              
              {hasUnsavedChanges && !isAutoSaving && (
                <div className="flex items-center text-sm text-yellow-300">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Unsaved changes
                </div>
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
                  isSaving
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-[#ED7600] hover:bg-[#D56900]'
                }`}
                title={floorPlanData?.id ? 'Update your saved floor plan' : 'Save floor plan to your account'}
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
                    {floorPlanData?.id ? 'Update Floor Plan' : 'Save Floor Plan'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#1e2a3a] rounded-lg shadow-xl border border-[#ED7600]">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium text-white">
                  {viewMode === '2d' ? 'Interactive Floor Plan Editor' : '3D Floor Plan Viewer'}
                </h2>
                <p className="text-sm text-gray-300 mt-1">
                  {viewMode === '2d' 
                    ? 'Drag rooms to reposition them, drag corners to resize, or click to select and view details.'
                    : 'Experience your floor plan in 3D with realistic lighting, furniture, and walk-through mode.'
                  }
                </p>
              </div>
              
              {viewMode === '2d' && (
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
                    <span>25px Grid</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#ED7600] rounded mr-2"></div>
                    <span>Selected Room</span>
                  </div>
                </div>
              )}
            </div>

            {/* Floor Plan Canvas */}
            <div className="flex justify-center">
              {viewMode === '2d' ? (
                <div className="bg-white rounded-lg shadow-2xl border-4 border-[#1e2a3a] overflow-hidden">
                  <KonvaFloorPlan
                    floorPlanData={floorPlanData}
                    width={1000}
                    height={500}
                    isEditable={true}
                    onRoomUpdate={handleRoomUpdate}
                    onFloorPlanUpdate={handleFloorPlanUpdate}
                  />
                </div>
              ) : (
                <div className="w-full h-[500px] rounded-lg overflow-hidden border border-[#ED7600]">
                  <React.Suspense 
                    fallback={
                      <div className="flex items-center justify-center h-full bg-[#2F3D57]">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED7600] mx-auto mb-4"></div>
                          <p className="text-gray-300">Loading 3D Viewer...</p>
                        </div>
                      </div>
                    }
                  >
                    <FloorPlan3D 
                      floorPlanData={floorPlanData}
                      className="w-full h-full"
                    />
                  </React.Suspense>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Panel */}
        <div className="mt-8 bg-[#1e2a3a] border border-[#ED7600] rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <span className="bg-[#ED7600] w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white font-bold">
              {viewMode === '2d' ? '📐' : '🏗️'}
            </span>
            {viewMode === '2d' ? 'Customization Instructions' : '3D Viewer Features'}
          </h3>
          
          {viewMode === '2d' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-[#2F3D57] p-4 rounded-lg border border-[#ED7600]/30">
                <h4 className="font-medium text-[#ED7600] mb-2 flex items-center">
                  <span className="mr-2">🔄</span> Moving Rooms
                </h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Click and drag any room to move it</li>
                  <li>• Rooms snap to a 25px grid for alignment</li>
                  <li>• Rooms are constrained within plot boundaries</li>
                </ul>
              </div>
              <div className="bg-[#2F3D57] p-4 rounded-lg border border-[#ED7600]/30">
                <h4 className="font-medium text-[#ED7600] mb-2 flex items-center">
                  <span className="mr-2">🔧</span> Resizing Rooms
                </h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Select a room by clicking on it</li>
                  <li>• Drag the orange handles to resize</li>
                  <li>• Minimum room size is enforced</li>
                </ul>
              </div>
              <div className="bg-[#2F3D57] p-4 rounded-lg border border-[#ED7600]/30">
                <h4 className="font-medium text-[#ED7600] mb-2 flex items-center">
                  <span className="mr-2">💾</span> Saving Changes
                </h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Click <strong className="text-[#ED7600]">"Save Floor Plan"</strong> to save your design</li>
                  <li>• View saved plans in <strong className="text-[#ED7600]">"My Progress"</strong> section</li>
                  <li>• Auto-save updates existing plans every 2 seconds</li>
                  <li>• New plans must be manually saved first</li>
                  <li>• 3D view updates automatically with 2D changes</li>
                  <li>• Export your design as JSON file anytime</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-[#2F3D57] p-4 rounded-lg border border-[#ED7600]/30">
                <h4 className="font-medium text-[#ED7600] mb-2 flex items-center">
                  <span className="mr-2">🪟</span> 3D Features
                </h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Realistic windows with light yellow glass</li>
                  <li>• Interactive doors that open/close on click</li>
                  <li>• Soft shadows and realistic lighting</li>
                  <li>• Color-coded rooms for easy identification</li>
                </ul>
              </div>
              <div className="bg-[#2F3D57] p-4 rounded-lg border border-[#ED7600]/30">
                <h4 className="font-medium text-[#ED7600] mb-2 flex items-center">
                  <span className="mr-2">🕹️</span> Controls
                </h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• <strong className="text-[#ED7600]">Overview Mode:</strong> Drag to orbit, scroll to zoom</li>
                  <li>• <strong className="text-[#ED7600]">Walk Mode:</strong> WASD keys + mouse look</li>
                  <li>• Switch between modes with buttons</li>
                  <li>• City skybox environment for realism</li>
                </ul>
              </div>
              <div className="bg-[#2F3D57] p-4 rounded-lg border border-[#ED7600]/30">
                <h4 className="font-medium text-[#ED7600] mb-2 flex items-center">
                  <span className="mr-2">📦</span> Export Options
                </h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Take screenshots of your 3D model</li>
                  <li>• Share your design with others</li>
                  <li>• <span className="text-[#ED7600]">🪑</span> Furniture automatically placed by room type</li>
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
