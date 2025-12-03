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
  const navigate = useNavigate();
  const { user } = useAuth();

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
          setSavedPlans(response.data || []);
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
      // Backend plan
      setSelectedPlan(plan);
    }
  };

  const handleDeletePlan = async (planId, isLocalStorage = false) => {
    try {
      if (isLocalStorage) {
        localStorage.removeItem(planId);
      } else {
        await floorplanAPI.deleteFloorplan(planId);
      }
      setSavedPlans(savedPlans.filter(p => p._id !== planId && p.key !== planId));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting floor plan:', err);
      alert('Failed to delete floor plan');
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
    <div className="p-8 bg-linear-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            My Floor Plan Progress
          </h2>
          <p className="text-gray-600 mt-2">
            Track and manage all your saved floor plan designs
          </p>
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
        {savedPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedPlans.map((plan) => (
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
                    {plan.is_favorite && (
                      <FiStar className="text-yellow-300 fill-current" />
                    )}
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
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Floor Plans Yet!</h3>
            <p className="text-gray-500 mb-6">
              Start creating amazing floor plans for your projects
            </p>
            <button
              onClick={() => navigate('/user/plot-browsing')}
              className="bg-[#ED7600] text-white px-6 py-3 rounded-lg hover:bg-[#d46000] transition-colors font-semibold"
            >
              Browse Plots
            </button>
          </div>
        )}
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