import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash, FiEye, FiDownload, FiLayers, FiHome, FiGrid, FiStar, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { floorplanAPI } from '../../services/floorplanAPI';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useConfirm } from '../../hooks/useConfirm';
import jsPDF from 'jspdf';

// Remove the SaveFloorPlanModal component as it's not needed anymore

// Floor Plan Card Component
const FloorPlanCard = ({ plan, onView, onDelete, onDownload }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden">
      <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
        {plan.image_data ? (
          <img src={plan.image_data} alt={plan.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-4">
            <div className="text-gray-400 mb-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>🛏️ {plan.bedrooms || 0} BR</div>
                <div>🛁 {plan.bathrooms || 0} Bath</div>
                <div>🛋️ {plan.living_rooms || 0} Living</div>
                <div>🍳 {plan.kitchens || 0} Kitchen</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-[#2F3D57] mb-2">{plan.name}</h3>
        <div className="text-sm text-gray-600 mb-3">
          <div>📐 Plot: {plan.plot_x}' × {plan.plot_y}'</div>
          <div className="text-xs text-gray-400 mt-1">
            Created: {new Date(plan.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onView(plan)}
            className="flex-1 bg-[#2F3D57] hover:bg-[#1f2a3d] text-white py-2 px-3 rounded text-sm flex items-center justify-center gap-2 transition-all"
          >
            <FiEye size={16} />
            View
          </button>
          <button
            onClick={() => onDownload(plan)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-all"
            title="Download PDF"
          >
            <FiDownload size={16} />
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm transition-all"
            title="Delete"
          >
            <FiTrash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const FloorPlanManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { confirmState, showConfirm } = useConfirm();

  // Fetch floor plans on mount and when user changes
  useEffect(() => {
    fetchFloorPlans();
  }, [user]);
  
  // Also fetch when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page visible, refreshing floor plans...');
        fetchFloorPlans();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const fetchFloorPlans = async () => {
    // Support both user.id and user.user_id
    const userId = user?.user_id || user?.id;
    
    if (!user || !userId) {
      console.warn('⚠️ No user or user_id found', { user });
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Fetching floor plans for subadmin user_id:', userId);
      console.log('👤 User object:', user);
      
      // Use society endpoint for subadmins to get all floor plans in their society
      const response = await fetch(`http://localhost:5000/api/floorplan/society/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📊 Floor plans data received:', data);
      console.log('🏠 Number of floor plans:', data.floorplans?.length || 0);
      
      setFloorPlans(data.floorplans || []);
    } catch (error) {
      console.error('❌ Error fetching floor plans:', error);
      setFloorPlans([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFloorPlan = () => {
    navigate('/floor-plan/generate');
  };

  const handleDownload = async (plan) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      if (plan.image_data) {
        const img = new Image();
        img.src = plan.image_data;
        await new Promise(resolve => {
          img.onload = resolve;
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (img.height * pdfWidth) / img.width;
        
        pdf.addImage(plan.image_data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${plan.name || 'floor-plan'}.pdf`);
        showNotification('📥 Floor plan downloaded successfully!', 'success');
      } else {
        showNotification('No preview image available for download', 'error');
      }
    } catch (error) {
      console.error('Error downloading floor plan:', error);
      showNotification('Failed to download floor plan', 'error');
    }
  };

  const handleDelete = async (planId) => {
    const confirmed = await showConfirm({
      title: 'Delete Floor Plan',
      message: 'Are you sure you want to delete this floor plan? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      const userId = user?.user_id || user?.id;
      await floorplanAPI.deleteFloorplan(planId, userId);
      showNotification('🗑️ Floor plan deleted successfully!', 'success');
      fetchFloorPlans();
    } catch (error) {
      console.error('Error deleting floor plan:', error);
      showNotification('Failed to delete floor plan', 'error');
    }
  };

  const handleView = (plan) => {
    // Navigate to customization page with floor plan data
    localStorage.setItem('currentFloorPlan', JSON.stringify({
      id: plan.id,
      _id: plan._id || plan.id,
      projectName: plan.name || plan.project_name,
      rooms: plan.room_data || plan.floor_plan_data?.rooms || [],
      walls: plan.floor_plan_data?.walls || [],
      doors: plan.floor_plan_data?.doors || [],
      plotDimensions: plan.dimensions || plan.floor_plan_data?.plotDimensions || { width: plan.plot_x || 1000, height: plan.plot_y || 1000 },
      mapData: plan.floor_plan_data?.mapData || [],
      constraints: plan.constraints || {}
    }));
    navigate('/floor-plan/customize');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoomCount = (plan) => {
    // First try to count from room_data array
    if (plan.room_data && Array.isArray(plan.room_data)) {
      return plan.room_data.length;
    }
    // Fallback to floor_plan_data.rooms
    if (plan.floor_plan_data?.rooms && Array.isArray(plan.floor_plan_data.rooms)) {
      return plan.floor_plan_data.rooms.length;
    }
    // Last resort: sum of individual room counts
    return (plan.bedrooms || 0) + (plan.bathrooms || 0) + (plan.living_rooms || 0) + (plan.kitchens || 0);
  };

  const calculateArea = (plan) => {
    const width = plan.plot_x || plan.dimensions?.width || 0;
    const height = plan.plot_y || plan.dimensions?.height || 0;
    return width * height;
  };

  const calculateMarla = (area) => {
    // 1 Marla = 272.25 square feet (approximately)
    const marlas = area / 272.25;
    return marlas.toFixed(2);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const [notification, setNotification] = useState(null);

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Notification Toast */}
          {notification && (
            <div 
              className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl border-l-4 flex items-center gap-3 transition-all duration-300 ${
                notification.type === 'success' 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}
            >
              {notification.type === 'success' ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          )}
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                  Society Floor Plans
                </h2>
                <p className="text-gray-600 mt-2">
                  Manage and track all floor plan designs for your society
                </p>
              </div>
              
              <button
                onClick={handleGenerateFloorPlan}
                className="bg-[#ED7600] hover:bg-[#d46000] text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                <FiPlus size={20} />
                Generate Floor Plan
              </button>
            </div>
          </div>

          {/* Floor Plans Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED7600]"></div>
              <p className="mt-4 text-gray-600">Loading floor plans...</p>
            </div>
          ) : floorPlans.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <FiLayers size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Floor Plans Yet</h3>
              <p className="text-gray-500 mb-6">Create your first floor plan to get started</p>
              <button
                onClick={handleGenerateFloorPlan}
                className="bg-[#ED7600] hover:bg-[#d46000] text-white font-bold py-3 px-6 rounded-lg inline-flex items-center gap-2 transition-all"
              >
                <FiPlus size={20} />
                Generate Floor Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {floorPlans.map((plan) => (
                <div
                  key={plan.id || plan._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-[#ED7600] to-[#ff8c1a] p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg truncate">
                          {plan.name || plan.project_name || 'Untitled Plan'}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Room Count */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FiHome className="text-gray-400" />
                      <span>{getRoomCount(plan)} Rooms</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FiCalendar className="text-gray-400" />
                      <span>{formatDate(plan.created_at)}</span>
                    </div>
                  </div>

                  {/* Card Footer - Action Buttons */}
                  <div className="p-4 bg-gray-50 border-t flex gap-2">
                    <button
                      onClick={() => handleView(plan)}
                      className="flex-1 bg-[#2F3D57] hover:bg-[#1f2a3d] text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <FiEye size={16} />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id || plan._id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm transition-all"
                      title="Delete"
                    >
                      <FiTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Confirm Modal */}
      <ConfirmModal {...confirmState} />
    </div>
  );
};

export default FloorPlanManager;
