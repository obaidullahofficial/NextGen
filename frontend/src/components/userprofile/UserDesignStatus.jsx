import React, { useState, useEffect } from "react";
import { userProfileAPI } from "../../services/userProfileAPI";
import { Eye, FileText, Calendar, MapPin, AlertCircle } from "lucide-react";

const UserDesignStatus = () => {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  const fetchApprovalRequests = async () => {
    try {
      setLoading(true);
      const response = await userProfileAPI.getApprovalRequests();
      if (response.success) {
        setMyRequests(response.data || []);
      } else {
        setError(response.message || "Failed to fetch requests");
      }
    } catch (err) {
      setError(err.message || "An error occurred while fetching requests");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusColors = {
    Approved: "bg-green-100 text-green-700 border border-green-300",
    Pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    Rejected: "bg-red-100 text-red-700 border border-red-300",
    "In Review": "bg-blue-100 text-blue-700 border border-blue-300",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED7600]"></div>
          <p className="mt-4 text-gray-600">Loading your design requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error Loading Requests</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchApprovalRequests}
            className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
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
            My Design Request History
          </h2>
          <p className="text-gray-600 mt-2">
            Track all your plot design requests and their approval status
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-gray-800">{myRequests.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-gray-800">
              {myRequests.filter((r) => r.status === "Pending").length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-gray-800">
              {myRequests.filter((r) => r.status === "Approved").length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-gray-800">
              {myRequests.filter((r) => r.status === "Rejected").length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Requests Table */}
        {myRequests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Design Requests Yet
            </h3>
            <p className="text-gray-600">
              You haven't submitted any plot design requests. Start by requesting approval for your plot design!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead className="bg-[#ED7600] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Request ID</th>
                    <th className="px-6 py-4 text-left font-semibold">Plot Info</th>
                    <th className="px-6 py-4 text-left font-semibold">Design Type</th>
                    <th className="px-6 py-4 text-left font-semibold">Request Date</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((req, index) => (
                    <tr
                      key={req._id}
                      className={`transition-all duration-200 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-orange-50 border-b border-gray-200`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        #{req._id?.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {req.plot_number || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {req.society_name || "Unknown Society"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {req.design_type || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">
                            {formatDate(req.request_date || req.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            statusColors[req.status] || statusColors.Pending
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="flex items-center gap-2 text-[#ED7600] hover:text-[#d46000] font-medium text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#ED7600] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    statusColors[selectedRequest.status] || statusColors.Pending
                  }`}
                >
                  {selectedRequest.status}
                </span>
                <span className="text-sm text-gray-500">
                  Request ID: #{selectedRequest._id?.slice(-8).toUpperCase()}
                </span>
              </div>

              {/* Request Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Plot Number</label>
                  <p className="mt-1 text-gray-900">{selectedRequest.plot_number || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Society</label>
                  <p className="mt-1 text-gray-900">{selectedRequest.society_name || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Design Type</label>
                  <p className="mt-1 text-gray-900">{selectedRequest.design_type || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Request Date</label>
                  <p className="mt-1 text-gray-900">
                    {formatDate(selectedRequest.request_date || selectedRequest.created_at)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Your Notes</label>
                  <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {/* Admin Comments */}
              {selectedRequest.admin_comments && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Admin Comments</label>
                  <p className="mt-1 text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {selectedRequest.admin_comments}
                  </p>
                </div>
              )}

              {/* Review Information */}
              {selectedRequest.reviewed_at && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Reviewed By</label>
                    <p className="mt-1 text-gray-900">
                      {selectedRequest.reviewed_by_name || "Admin"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Review Date</label>
                    <p className="mt-1 text-gray-900">
                      {formatDate(selectedRequest.reviewed_at)}
                    </p>
                  </div>
                </div>
              )}

              {/* Floor Plan */}
              {selectedRequest.floor_plan_file_url && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Floor Plan
                  </label>
                  <a
                    href={selectedRequest.floor_plan_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#ED7600] text-white px-4 py-2 rounded-lg hover:bg-[#d46000] transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    View Floor Plan
                  </a>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedRequest(null)}
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

export default UserDesignStatus;
