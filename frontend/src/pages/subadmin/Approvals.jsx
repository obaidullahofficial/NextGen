// components/Approvals.jsx
import React,{ useState, useEffect } from "react";
import { FaCheck, FaTimes, FaSearch, FaEye, FaEdit, FaDownload } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { userProfileAPI } from "../../services/userProfileAPI";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../services/baseApiService";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Approvals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' or 'reject'
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  // viewMode: 'current' shows pending requests; 'history' shows approved/rejected
  const [viewMode, setViewMode] = useState('current');

  // Load approval requests from backend for subadmin/admin
  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const response = await userProfileAPI.getAllApprovalRequests();
        let rawList = response.data || [];

        // On society (subadmin) panel, show only requests for this society if we know its ID
        if ((user?.role === 'society' || user?.role === 'subadmin') && user.societyId) {
          rawList = rawList.filter((req) => req.society_id === user.societyId);
        }

        const list = rawList.map((req) => {
          const filePath = req.floor_plan_file_url; // e.g., "uploads/user_profiles/.../file.json"
          const fileUrl = filePath ? `${API_URL}/file/${filePath}` : null;

          return {
            id: req._id,
            // Prefer human-readable plot_number; fall back to plot_id if needed
            plotNumber: req.plot_number || req.plot_id || "",
            plotDetails: req.plot_details || "",
            requestDate: req.request_date || req.created_at || "",
            // Time when subadmin/admin approved or rejected the request
            actionTime: req.reviewed_at || null,
            status: req.status || "Pending",
            requestType: "Floor Plan Approval",
            designType: req.design_type || "",
            details: {
              architect: "",
              area: req.area || "",
              floors: "",
              submittedDocuments: fileUrl
                ? [
                    {
                      name: "Floor Plan",
                      url: fileUrl,
                    },
                  ]
                : [],
              notes: req.notes || "",
            },
            raw: req,
          };
        });
        setApprovals(list);
      } catch (err) {
        setError(err.message || "Failed to load approval requests");
      } finally {
        setLoading(false);
      }
    };

    // Avoid running before auth user is loaded
    if (!user) {
      setLoading(false);
      return;
    }

    fetchApprovals();
  }, [user]);

  // Chart data for approval status
  // In current view: show Approved vs Pending (pipeline state)
  // In history view: show Approved vs Rejected (final outcomes only)
  const approvalStats = viewMode === 'history'
    ? {
        labels: ['Approved', 'Rejected'],
        datasets: [{
          label: 'Floor Plan Approvals (History)',
          data: [
            approvals.filter(a => a.status === 'Approved').length,
            approvals.filter(a => a.status === 'Rejected').length,
          ],
          backgroundColor: ['#16a34a', '#dc2626'],
          borderColor: ['#15803d', '#b91c1c'],
          borderWidth: 1,
        }],
      }
    : {
        labels: ['Approved', 'Pending'],
        datasets: [{
          label: 'Floor Plan Approvals (Current)',
          data: [
            approvals.filter(a => a.status === 'Approved').length,
            approvals.filter(a => a.status === 'Pending').length,
          ],
          backgroundColor: ['#2f3d57', '#ED7600'],
          borderColor: ['#2f3d57', '#ED7600'],
          borderWidth: 1,
        }],
      };

  const updateStatus = async (id, newStatus) => {
    try {
      console.log("Updating approval status", { id, newStatus });
      const response = await userProfileAPI.updateApprovalRequestStatus(id, newStatus);
      console.log("Update status response", response);

      // In our API wrapper, the response shape is { success, data, message }
      // but if that ever changes, fall back to using the whole object.
      const updated = response?.data || response;

      if (!updated || !updated.status) {
        console.warn("Update response did not contain expected fields", updated);
      }

      setApprovals((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: updated.status || a.status,
                // record when this action was taken
                actionTime: updated.reviewed_at || a.actionTime || null,
                details: {
                  ...a.details,
                  // Show latest admin comments (if any) inside notes section
                  notes: updated.admin_comments || a.details.notes,
                },
                raw: updated,
              }
            : a
        )
      );
    } catch (err) {
      console.error("Failed to update approval request status", err);
      setError(err.message || "Failed to update status");
      alert(err.message || "Failed to update status. Please check the browser console/network tab for details.");
    }
  };

  const handleApprove = (id) => {
    setConfirmTargetId(id);
    setConfirmAction('Approved');
    setShowConfirmDialog(true);
  };

  const handleReject = (id) => {
    setConfirmTargetId(id);
    setConfirmAction('Rejected');
    setShowConfirmDialog(true);
  };

  const confirmActionHandler = () => {
    if (confirmAction === 'Approved') {
      updateStatus(confirmTargetId, "Approved");
    } else if (confirmAction === 'reject') {
      updateStatus(confirmTargetId, "Rejected");
    }
    setShowConfirmDialog(false);
    setConfirmTargetId(null);
    setConfirmAction(null);
  };

  const cancelConfirmation = () => {
    setShowConfirmDialog(false);
    setConfirmTargetId(null);
    setConfirmAction(null);
  };

  const handleViewDetails = (approval) => {
    setSelectedApproval(approval);
    setViewingDocument(null);
    setShowModal(true);
  };

  // Helper to format request date nicely (date + time) instead of raw ISO
  const formatRequestDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDocument = (doc) => {
    // doc is an object: { name, url }
    setViewingDocument(doc);
  };

  const handleOpenInGenerator = (approval) => {
    const doc = approval.details.submittedDocuments?.[0];
    if (!doc || !doc.url) {
      alert('No floor plan JSON is attached to this approval request.');
      return;
    }

    navigate('/floor-plan/generate', {
      state: {
        importFromUrl: doc.url,
        approvalRequestId: approval.id,
      },
    });
  };

  const handleCloseDocument = () => {
    setViewingDocument(null);
  };

  const filteredApprovals = approvals.filter(approval => {
    // Filter by view mode: current = pending; history = approved/rejected/other
    const inViewMode = viewMode === 'current'
      ? approval.status === "Pending"
      : approval.status !== "Pending";

    if (!inViewMode) return false;

    // Existing search filter
    return approval.requestType === "Floor Plan Approval" && 
           Object.values(approval).some(
             value => value.toString().toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e6e9f0] text-[#2F3D57]">
      {/* Modal for viewing details */}
      {showModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-[#2F3D57]">
                  Floor Plan Approval Details
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Plot Number:</span> {selectedApproval.plotNumber}</p>
                    <p><span className="font-medium">Design Type:</span> {selectedApproval.designType}</p>
                    <p><span className="font-medium">Request Date:</span> {formatRequestDate(selectedApproval.requestDate)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedApproval.status === "Approved" 
                          ? "bg-green-100 text-green-800" 
                          : selectedApproval.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {selectedApproval.status}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Project Details</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Area:</span> {selectedApproval.details.area}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Submitted Documents</h3>
                <div className="space-y-2">
                  {selectedApproval.details.submittedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span>{doc.name}</span>
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="text-[#2F3D57] hover:text-[#1E2A3B] flex items-center gap-1"
                      >
                        <FaEye size={14} /> View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Notes</h3>
                </div>
                <p className="bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedApproval.details.notes}</p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#2F3D57] text-white rounded-lg hover:bg-[#1E2A3B]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold">{viewingDocument.name}</h3>
              <button 
                onClick={handleCloseDocument}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex-grow p-6 overflow-auto bg-gray-100 flex items-center justify-center">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-inner border border-gray-200 w-full h-full flex flex-col">
                <div className="flex-1 overflow-auto mb-4 flex items-center justify-center bg-gray-50">
                  {viewingDocument.url ? (
                    <iframe
                      src={viewingDocument.url}
                      title={viewingDocument.name}
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <p className="text-gray-600">No document URL available.</p>
                  )}
                </div>
                <div className="flex justify-end">
                  {viewingDocument.url && (
                    <a
                      href={viewingDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#2F3D57] text-white rounded-lg hover:bg-[#1E2A3B] flex items-center gap-2"
                    >
                      <FaDownload /> Download Document
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={handleCloseDocument}
                className="px-4 py-2 bg-[#2F3D57] text-white rounded-lg hover:bg-[#1E2A3B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#2F3D57]">
          Floor Plan Approval Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('current')}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              viewMode === 'current'
                ? 'bg-[#2F3D57] text-white border-[#2F3D57]'
                : 'bg-white text-[#2F3D57] border-gray-300 hover:bg-gray-100'
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              viewMode === 'history'
                ? 'bg-[#ED7600] text-white border-[#ED7600]'
                : 'bg-white text-[#2F3D57] border-gray-300 hover:bg-gray-100'
            }`}
          >
            History
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-lg font-semibold mb-4">Approval Status</h3>
        <div className="h-64">
          <Bar 
            data={approvalStats}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: ctx => `${ctx.label}: ${ctx.raw} plans`
                  }
                }
              },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
              }
            }}
          />
        </div>
      </div>

      <div className="flex mb-6 p-4 bg-white rounded-xl shadow-md">
        <div className="relative flex-grow">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search floor plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F3D57] focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#2F3D57] text-white">
              <tr>
                <th className="px-6 py-4 text-left">Plot Number</th>
                <th className="px-6 py-4 text-left">Design Type</th>
                <th className="px-6 py-4 text-left">Request Date</th>
                {viewMode === 'history' && (
                  <th className="px-6 py-4 text-left">Action Time</th>
                )}
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApprovals.length > 0 ? (
                filteredApprovals.map(approval => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{approval.plotNumber}</td>
                    <td className="px-6 py-4">{approval.designType}</td>
                    <td className="px-6 py-4">{formatRequestDate(approval.requestDate)}</td>
                    {viewMode === 'history' && (
                      <td className="px-6 py-4">{approval.actionTime ? formatRequestDate(approval.actionTime) : '-'}</td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        approval.status === "Approved" 
                          ? "bg-green-100 text-green-800" 
                          : approval.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {approval.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleViewDetails(approval)}
                          className="bg-[#2F3D57] text-white px-3 py-1 rounded-lg hover:bg-[#1E2A3B] flex items-center gap-1"
                        >
                          <FaEye size={14} /> View
                        </button>
                        <button
                          onClick={() => handleOpenInGenerator(approval)}
                          className="bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 flex items-center gap-1"
                        >
                          Open in Generator
                        </button>
                        {approval.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(approval.id)}
                              className="bg-green-500 text-white px-4 py-1 rounded-lg hover:bg-green-600 flex items-center gap-1"
                            >
                              <FaCheck size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(approval.id)}
                              className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 flex items-center gap-1"
                            >
                              <FaTimes size={14} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
              <tr>
                <td
                  colSpan={viewMode === 'history' ? 6 : 5}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No floor plan approvals found
                </td>
              </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-200">
              {confirmAction === 'Approved' ? (
                <FaCheck className="text-green-600 text-2xl" />
              ) : (
                <FaTimes className="text-red-600 text-2xl" />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {confirmAction === 'Approved' ? 'Approve Floor Plan?' : 'Reject Floor Plan?'}
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              {confirmAction === 'Approved' 
                ? 'Are you sure you want to approve this floor plan? '
                : 'Are you sure you want to reject this floor plan? '}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={cancelConfirmation}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmActionHandler}
                className={`flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors ${
                  confirmAction === 'Approved'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmAction === 'Approved' ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
