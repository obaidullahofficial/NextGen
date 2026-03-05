import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiInbox, 
  FiEye, 
  FiTrash2, 
  FiCalendar, 
  FiLayers,
  FiHome,
  FiGrid,
  FiStar,
  FiEdit2
} from 'react-icons/fi';
import { floorplanAPI } from '../../services/floorplanAPI';
import { useAuth } from '../../context/AuthContext';

const MyProgress = () => {
  const [savedPlans, setSavedPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'favorites', 'active'
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Show notification and auto-hide after 3 seconds
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetchSavedPlans();
  }, []);

  const fetchSavedPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from backend if user is available
      if (user && user.id) {
        const response = await floorplanAPI.getUserFloorplans(user.id);
        if (response.success) {
          const backendPlans = response.floor_plans || response.data || [];
          
          // Ensure each plan has required properties with defaults
          const formattedPlans = backendPlans.map(plan => ({
            ...plan,
            status: 'active',
            is_favorite: plan.is_favorite || false,
            room_data: plan.room_data || plan.floor_plan_data?.rooms || []
          }));
          
          setSavedPlans(formattedPlans);
        }
      } else {
        // Fallback to localStorage
        fetchLocalStoragePlans();
      }
    } catch (err) {
      console.error('Error fetching floor plans:', err);
      // Fallback to localStorage on error
      fetchLocalStoragePlans();
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalStoragePlans = () => {
    const plans = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('floorPlanLayout-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const parts = key.split('-');
          plans.push({
            _id: key,
            key,
            societyId: parts[1],
            plotId: parts[2],
            project_name: data.projectName || `Plan for Plot ${parts[2]}`,
            created_at: data.dateSaved || new Date().toISOString(),
            constraints: data.constraints,
            dimensions: {
              width: data.constraints?.plotX || 0,
              height: data.constraints?.plotY || 0,
            },
            room_data: data.rooms || [],
            status: 'active',
            is_favorite: data.isFavorite || false,
          });
        } catch (error) {
          console.error('Error parsing localStorage plan:', error);
        }
      }
    }
    setSavedPlans(plans);
  };

  const handleViewPlan = (plan) => {
    if (plan.key) {
      // LocalStorage plan
      navigate(`/generate-floor-plan/${plan.societyId}/${plan.plotId}`, {
        state: { plotDimensions: { x: plan.constraints?.plotX, y: plan.constraints?.plotY } }
      });
    } else {
      // Backend plan - Navigate to customization page with floor plan data
      console.log('🔍 Viewing saved floor plan:', plan);
      navigate('/floor-plan/customize', {
        state: {
          floorPlan: {
            id: plan._id,
            _id: plan._id,
            project_name: plan.project_name, // Ensure project name is passed
            projectName: plan.project_name, // Legacy compatibility
            rooms: plan.floor_plan_data?.rooms || plan.room_data || [],
            walls: plan.floor_plan_data?.walls || [],
            doors: plan.floor_plan_data?.doors || [],
            plotDimensions: plan.dimensions || plan.floor_plan_data?.plotDimensions || { width: 1000, height: 1000 },
            mapData: plan.floor_plan_data?.mapData || [],
            constraints: plan.constraints || {},
            user_id: user?.id,
            // Include all floor plan data for proper rendering
            floor_plan_data: plan.floor_plan_data,
            room_data: plan.room_data
          }
        }
      });
    }
  };

  const handleDeletePlan = async (planId, isLocalStorage = false) => {
    try {
      if (isLocalStorage) {
        localStorage.removeItem(planId);
      } else {
        if (!user || !user.id) {
          alert('User not authenticated');
          return;
        }
        await floorplanAPI.deleteFloorplan(planId, user.id);
      }
      setSavedPlans(savedPlans.filter(p => p._id !== planId && p.key !== planId));
      setShowDeleteConfirm(null);
      showNotification('🗑️ Floor plan deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting floor plan:', err);
      showNotification('Failed to delete floor plan: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleToggleFavorite = async (planId, currentFavoriteStatus) => {
    try {
      if (!user || !user.id) {
        showNotification('User not authenticated', 'error');
        return;
      }
      
      await floorplanAPI.toggleFavorite(planId, user.id, !currentFavoriteStatus);
      
      // Update local state
      setSavedPlans(savedPlans.map(p => 
        p._id === planId ? { ...p, is_favorite: !currentFavoriteStatus } : p
      ));
      
      // Show success notification
      showNotification(
        !currentFavoriteStatus ? '⭐ Added to favorites!' : 'Removed from favorites',
        'success'
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
      showNotification('Failed to update favorite status', 'error');
    }
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
    if (plan.room_data && Array.isArray(plan.room_data)) {
      return plan.room_data.length;
    }
    if (plan.constraints && plan.constraints.rooms) {
      return plan.constraints.rooms.length;
    }
    return 0;
  };

  // Filter plans based on selected filter
  const filteredPlans = savedPlans.filter(plan => {
    if (filterType === 'favorites') return plan.is_favorite;
    if (filterType === 'active') return plan.status === 'active';
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED7600]"></div>
          <p className="mt-4 text-gray-600">Loading your floor plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full space-y-6">
          {/* Notification Toast */}
          {notification && (
          <div 
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl border-l-4 flex items-center gap-3 transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
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
                My Floor Plan Progress
              </h2>
              <p className="text-gray-600 mt-2">
                Track and manage all your saved floor plan designs
              </p>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 bg-white rounded-lg shadow p-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  filterType === 'all'
                    ? 'bg-[#ED7600] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Plans
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filterType === 'all' ? 'bg-white text-[#ED7600]' : 'bg-gray-200'
                }`}>
                  {savedPlans.length}
                </span>
              </button>
              <button
                onClick={() => setFilterType('favorites')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  filterType === 'favorites'
                    ? 'bg-yellow-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiStar className={filterType === 'favorites' ? 'fill-current' : ''} />
                Favorites
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filterType === 'favorites' ? 'bg-white text-yellow-500' : 'bg-gray-200'
                }`}>
                  {savedPlans.filter(p => p.is_favorite).length}
                </span>
              </button>
              <button
                onClick={() => setFilterType('active')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                  filterType === 'active'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Active
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filterType === 'active' ? 'bg-white text-green-500' : 'bg-gray-200'
                }`}>
                  {savedPlans.filter(p => p.status === 'active').length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">{savedPlans.length}</div>
                <div className="text-sm text-gray-600">Total Plans</div>
              </div>
              <FiLayers className="text-3xl text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {savedPlans.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <FiHome className="text-3xl text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {savedPlans.filter(p => p.is_favorite).length}
                </div>
                <div className="text-sm text-gray-600">Favorites</div>
              </div>
              <FiStar className="text-3xl text-yellow-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Floor Plans Grid */}
        {filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan._id || plan.key}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="bg-linear-to-r from-[#ED7600] to-[#ff8c1a] p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg truncate">
                        {plan.project_name || plan.projectName || 'Untitled Plan'}
                      </h3>
                      {plan.plotId && (
                        <p className="text-sm opacity-90 mt-1">Plot: {plan.plotId}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(plan._id, plan.is_favorite);
                      }}
                      className="hover:scale-110 transition-transform"
                      title={plan.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <FiStar className={`text-2xl ${plan.is_favorite ? 'text-yellow-300 fill-current' : 'text-white opacity-50'}`} />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Dimensions */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiGrid className="text-gray-400" />
                    <span>
                      {plan.dimensions?.width || plan.constraints?.plotX || 0} x{' '}
                      {plan.dimensions?.height || plan.constraints?.plotY || 0} units
                    </span>
                  </div>

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

                  {/* Status Badge */}
                  <div className="pt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        plan.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : plan.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {plan.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => handleViewPlan(plan)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#ED7600] text-white px-4 py-2 rounded-lg hover:bg-[#d46000] transition-colors text-sm font-semibold"
                  >
                    <FiEye />
                    View
                  </button>
                  <button
                    onClick={() => handleToggleFavorite(plan._id, plan.is_favorite)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
                      plan.is_favorite
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title={plan.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <FiStar className={plan.is_favorite ? 'fill-current' : ''} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(plan._id || plan.key)}
                    className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-8 bg-white rounded-xl shadow-md border-2 border-dashed border-gray-300">
            <FiInbox className="mx-auto text-6xl text-gray-400 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              {filterType === 'favorites' 
                ? 'No Favorite Plans Yet!' 
                : filterType === 'active'
                ? 'No Active Plans!'
                : 'No Floor Plans Yet!'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filterType === 'favorites' 
                ? 'Mark floor plans as favorites by clicking the star icon' 
                : filterType === 'active'
                ? 'Create new floor plans to see them here'
                : 'Start creating amazing floor plans for your projects'}
            </p>
            {filterType !== 'all' && savedPlans.length > 0 && (
              <button
                onClick={() => setFilterType('all')}
                className="bg-[#ED7600] text-white px-6 py-3 rounded-lg hover:bg-[#d46000] transition-colors font-semibold"
              >
                Show All Plans
              </button>
            )}
            {savedPlans.length === 0 && (
              <button
                onClick={() => navigate('/user/plot-browsing')}
                className="bg-[#ED7600] text-white px-6 py-3 rounded-lg hover:bg-[#d46000] transition-colors font-semibold"
              >
                Browse Plots
              </button>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FiTrash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Floor Plan</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this floor plan? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const plan = savedPlans.find(p => (p._id || p.key) === showDeleteConfirm);
                    handleDeletePlan(showDeleteConfirm, !!plan?.key);
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPlan(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#ED7600] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">{selectedPlan.project_name}</h3>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Favorite */}
              <div className="flex items-center justify-between">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedPlan.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {selectedPlan.status}
                </span>
                {selectedPlan.is_favorite && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <FiStar className="fill-current" />
                    <span className="text-sm font-medium">Favorite</span>
                  </div>
                )}
              </div>

              {/* Plan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Dimensions</label>
                  <p className="mt-1 text-gray-900">
                    {selectedPlan.dimensions?.width} x {selectedPlan.dimensions?.height} units
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Total Rooms</label>
                  <p className="mt-1 text-gray-900">{getRoomCount(selectedPlan)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Created</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedPlan.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Last Updated</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedPlan.updated_at)}</p>
                </div>
              </div>

              {/* Room List */}
              {selectedPlan.room_data && selectedPlan.room_data.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Rooms</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPlan.room_data.map((room, idx) => (
                      <div key={idx} className="bg-gray-50 p-2 rounded-lg text-sm">
                        {room.type || room.name || `Room ${idx + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generation Parameters */}
              {selectedPlan.generation_parameters && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Generation Info
                  </label>
                  <div className="bg-blue-50 p-3 rounded-lg space-y-1 text-sm">
                    {selectedPlan.generation_parameters.algorithm && (
                      <p>Algorithm: {selectedPlan.generation_parameters.algorithm}</p>
                    )}
                    {selectedPlan.generation_parameters.fitness_score && (
                      <p>
                        Fitness Score:{' '}
                        {selectedPlan.generation_parameters.fitness_score.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedPlan(null)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProgress;