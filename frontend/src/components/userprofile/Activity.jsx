import React, { useState, useEffect } from 'react';
import { 
  FiActivity, 
  FiClock, 
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiInbox,
  FiRefreshCw
} from 'react-icons/fi';
import { userProfileAPI } from '../../services/userProfileAPI';
import { useAuth } from '../../context/AuthContext';

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Activity] Fetching data for user:', user?.id);

      // Fetch both activities and progress summary
      const [activitiesResponse, progressResponse] = await Promise.all([
        userProfileAPI.getUserActivities(50, 0),
        userProfileAPI.getUserProgress()
      ]);

      console.log('[Activity] Activities Response:', activitiesResponse);
      console.log('[Activity] Progress Response:', progressResponse);

      if (activitiesResponse.success) {
        setActivities(activitiesResponse.data || []);
      }

      if (progressResponse.success) {
        console.log('[Activity] Progress Summary Data:', progressResponse.data);
        setProgressSummary(progressResponse.data || null);
      } else {
        console.error('[Activity] Failed to fetch progress:', progressResponse);
      }
    } catch (err) {
      console.error('[Activity] Error fetching activity data:', err);
      setError(err.message || 'Failed to load activity data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'profile_update':
        return <FiUser className="text-blue-500" />;
      case 'request_submitted':
      case 'approval_request_submitted':
        return <FiFileText className="text-green-500" />;
      case 'request_approved':
      case 'approval_request_approved':
        return <FiCheckCircle className="text-green-600" />;
      case 'request_rejected':
      case 'approval_request_rejected':
        return <FiXCircle className="text-red-500" />;
      case 'approval_request_updated':
        return <FiActivity className="text-blue-500" />;
      case 'approval_request_deleted':
        return <FiXCircle className="text-orange-500" />;
      case 'floorplan_created':
        return <FiFileText className="text-purple-500" />;
      default:
        return <FiActivity className="text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'profile_update':
        return 'border-blue-500';
      case 'request_submitted':
      case 'approval_request_submitted':
        return 'border-green-500';
      case 'request_approved':
      case 'approval_request_approved':
        return 'border-green-600';
      case 'request_rejected':
      case 'approval_request_rejected':
        return 'border-red-500';
      case 'approval_request_updated':
        return 'border-blue-500';
      case 'approval_request_deleted':
        return 'border-orange-500';
      case 'floorplan_created':
        return 'border-purple-500';
      default:
        return 'border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED7600]"></div>
          <p className="mt-4 text-gray-600">Loading your activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              Activity Dashboard
            </h2>
            <p className="text-gray-600 mt-2">
              Track your progress and recent activities
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-[#ED7600] text-white px-4 py-2 rounded-lg hover:bg-[#d46000] transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Progress Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {progressSummary?.profile_completed ? '✓' : '○'}
                </div>
                <div className="text-sm text-gray-600">Profile Status</div>
              </div>
              <FiUser className="text-3xl text-blue-500 opacity-50" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {progressSummary?.profile_completed ? 'Completed' : 'Incomplete'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {progressSummary?.total_requests || 0}
                </div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
              <FiFileText className="text-3xl text-green-500 opacity-50" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              All time
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {progressSummary?.approved_requests || 0}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <FiCheckCircle className="text-3xl text-yellow-500 opacity-50" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Success rate: {progressSummary && progressSummary.total_requests > 0 
                ? Math.round((progressSummary.approved_requests / progressSummary.total_requests) * 100) 
                : 0}%
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {progressSummary?.pending_requests || 0}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <FiClock className="text-3xl text-purple-500 opacity-50" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Awaiting review
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#ED7600] to-[#ff8c1a] p-6 text-white">
            <div className="flex items-center gap-2">
              <FiActivity className="text-2xl" />
              <h3 className="text-xl font-bold">Recent Activity</h3>
            </div>
            <p className="text-sm opacity-90 mt-1">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'} recorded
            </p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <p className="font-semibold">Error loading activities</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div
                    key={activity._id || index}
                    className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${getActivityColor(
                      activity.activity_type
                    )} bg-gray-50 hover:bg-gray-100 transition-colors`}
                  >
                    <div className="mt-1 text-xl">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {activity.description || 'Activity'}
                      </h4>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-1 text-sm text-gray-600">
                          {activity.metadata.fields_updated && (
                            <p>Updated: {activity.metadata.fields_updated.join(', ')}</p>
                          )}
                          {activity.metadata.request_id && (
                            <p>Request ID: {activity.metadata.request_id}</p>
                          )}
                          {activity.metadata.status && (
                            <p>Status: {activity.metadata.status}</p>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <FiClock className="text-gray-400" />
                        <span>{formatDate(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-8">
                <FiInbox className="mx-auto text-6xl text-gray-400 mb-4" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  No Activity Yet
                </h3>
                <p className="text-gray-500">
                  Your recent activities will appear here once you start using the platform
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Activity Summary */}
        {progressSummary && (
          <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">This Month's Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <FiActivity />
                  <span className="font-semibold">Recent Activities</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {progressSummary.recent_activities || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">Actions this month</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <FiCheckCircle />
                  <span className="font-semibold">Completion Rate</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {progressSummary.total_requests > 0
                    ? Math.round((progressSummary.approved_requests / progressSummary.total_requests) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  {progressSummary.approved_requests} of {progressSummary.total_requests} approved
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
