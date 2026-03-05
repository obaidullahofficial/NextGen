import React, { useState, useEffect } from 'react';
import { FiEye } from 'react-icons/fi';
import advertisementAPI from '../../services/advertisementAPI';

const AdvertisementManagement = () => {
  const [pendingAds, setPendingAds] = useState([]);
  const [allAds, setAllAds] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [totalAllAdsCount, setTotalAllAdsCount] = useState(0);
  
  const [selectedAd, setSelectedAd] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(''); // 'approve', 'reject', 'edit', or 'delete'
  const [processing, setProcessing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    link_url: '',
    featured_image: '',
    status: 'pending'
  });

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingAds();
    } else {
      fetchAllAds();
    }
  }, [activeTab, page]);

  const fetchPendingAds = async () => {
    try {
      setLoading(true);
      const result = await advertisementAPI.getPendingAdvertisements(page, 10);
      if (result.success) {
        setPendingAds(result.data || []);
        setPagination(result.pagination || {});
        setTotalPendingCount(result.pagination?.total_count || 0);
      } else {
        setError(result.error || 'Failed to load pending advertisements');
      }
    } catch (err) {
      setError('Error loading pending advertisements');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAds = async () => {
    try {
      setLoading(true);
      const result = await advertisementAPI.getAllAdvertisements(page, 10);
      if (result.success) {
        setAllAds(result.data || []);
        setPagination(result.pagination || {});
        setTotalAllAdsCount(result.pagination?.total_count || 0);
      } else {
        setError(result.error || 'Failed to load advertisements');
      }
    } catch (err) {
      setError('Error loading advertisements');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (ad, action) => {
    setSelectedAd(ad);
    setModalAction(action);
    setAdminNotes('');
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAd(null);
    setAdminNotes('');
    setModalAction('');
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      setError('');
      const result = await advertisementAPI.approveAdvertisement(selectedAd._id);
      if (result.success) {
        setSuccess('Advertisement approved successfully and notification sent');
        closeModal();
        fetchPendingAds();
      } else {
        setError(result.error || 'Failed to approve advertisement');
      }
    } catch (err) {
      setError('Error approving advertisement');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      const result = await advertisementAPI.rejectAdvertisement(selectedAd._id, adminNotes);
      if (result.success) {
        setSuccess('Advertisement rejected and notification sent');
        closeModal();
        fetchPendingAds();
      } else {
        setError(result.error || 'Failed to reject advertisement');
      }
    } catch (err) {
      setError('Error rejecting advertisement');
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (ad) => {
    setSelectedAd(ad);
    setEditForm({
      title: ad.title || '',
      link_url: ad.link_url || '',
      featured_image: ad.featured_image || '',
      status: ad.status || 'pending'
    });
    setModalAction('edit');
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openDeleteModal = (ad) => {
    setSelectedAd(ad);
    setModalAction('delete');
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleEdit = async () => {
    try {
      setProcessing(true);
      setError('');
      
      const updateData = {
        title: editForm.title,
        link_url: editForm.link_url,
        featured_image: editForm.featured_image,
        status: editForm.status
      };
      
      const result = await advertisementAPI.updateAdvertisement(selectedAd._id, updateData);
      if (result.success) {
        setSuccess('Advertisement updated successfully');
        closeModal();
        if (activeTab === 'pending') {
          fetchPendingAds();
        } else {
          fetchAllAds();
        }
      } else {
        setError(result.error || 'Failed to update advertisement');
      }
    } catch (err) {
      setError('Error updating advertisement');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setProcessing(true);
      setError('');
      const result = await advertisementAPI.deleteAdvertisement(selectedAd._id);
      if (result.success) {
        setSuccess('Advertisement deleted successfully');
        closeModal();
        if (activeTab === 'pending') {
          fetchPendingAds();
        } else {
          fetchAllAds();
        }
      } else {
        setError(result.error || 'Failed to delete advertisement');
      }
    } catch (err) {
      setError('Error deleting advertisement');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      case 'expired':
        return 'status-expired';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2F3D57] mb-2">Advertisement Management</h1>
          <p className="text-gray-600">Review and approve advertisement requests from users</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠</span>
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 font-bold text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">✓</span>
              <span>{success}</span>
            </div>
            <button 
              onClick={() => setSuccess('')}
              className="text-green-600 hover:text-green-800 font-bold text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'all'
                ? 'border-[#ED7600] text-[#ED7600] bg-[#ED7600]/10'
                : 'border-transparent text-gray-600 hover:text-[#ED7600] hover:bg-[#ED7600]/10'
            }`}
            onClick={() => {
              setActiveTab('all');
              setPage(1);
            }}
          >
            All Advertisements ({totalAllAdsCount})
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'pending'
                ? 'border-[#ED7600] text-[#ED7600] bg-[#ED7600]/10'
                : 'border-transparent text-gray-600 hover:text-[#ED7600] hover:bg-[#ED7600]/10'
            }`}
            onClick={() => {
              setActiveTab('pending');
              setPage(1);
            }}
          >
            Pending Approval ({totalPendingCount})
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : activeTab === 'pending' ? (
            pendingAds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No pending advertisements</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {pendingAds.map(ad => (
                  <div key={ad._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-[#ED7600] transition-all duration-300">
                    <div className="relative">
                      <img
                        src={ad.featured_image || '/placeholder-ad.jpg'}
                        alt={ad.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => { e.target.src = '/placeholder-ad.jpg'; }}
                      />
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        {ad.plan_name}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{ad.title}</h3>
                      {ad.link_url && (
                        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 text-sm truncate block mb-3">
                          {ad.link_url}
                        </a>
                      )}
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">User:</span>
                          <span className="text-gray-900 font-medium">{ad.user_email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Society:</span>
                          <span className="text-gray-900 font-medium">{ad.society_name || ad.society_id || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Price:</span>
                          <span className="text-[#ED7600] font-bold">Rs {ad.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ad.payment_status === 'paid' ? 'bg-green-500 text-white' :
                            ad.payment_status === 'pending' ? 'bg-yellow-500 text-white' :
                            ad.payment_status === 'failed' ? 'bg-red-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {ad.payment_status || 'pending'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="text-gray-900 text-xs">{formatDate(ad.start_date)} - {formatDate(ad.end_date)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          className={`flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium shadow ${
                            ad.payment_status !== 'paid' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          onClick={() => openApprovalModal(ad, 'approve')}
                          disabled={ad.payment_status !== 'paid'}
                          title={ad.payment_status !== 'paid' ? 'Payment must be completed before approval' : 'Approve advertisement'}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow"
                          onClick={() => openApprovalModal(ad, 'reject')}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            allAds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No advertisements found</p>
              </div>
            ) : (
              <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="min-w-max w-full bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] text-white">
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[180px]">Title</th>
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[150px]">User</th>
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[120px]">Society</th>
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[100px]">Plan</th>
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[90px]">Price</th>
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[100px]">Payment</th>
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[100px]">Status</th>
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[140px]">Dates</th>
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[80px]">Views</th>
                      <th className="px-4 py-4 text-left font-semibold text-sm uppercase tracking-wider min-w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allAds.map(ad => (
                      <tr key={ad._id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200">
                        <td className="px-4 py-4">
                          <div className="max-w-[180px]">
                            <div className="font-semibold text-gray-900 text-sm truncate" title={ad.title}>{ad.title}</div>
                            {ad.link_url && <div className="text-xs text-blue-600 hover:text-blue-800 truncate mt-1" title={ad.link_url}>{ad.link_url}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-[150px] truncate" title={ad.user_email}>{ad.user_email}</td>
                        <td className="px-4 py-4 text-sm text-gray-700 font-medium truncate max-w-[120px]" title={ad.society_name || ad.society_id}>{ad.society_name || ad.society_id || 'N/A'}</td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">{ad.plan_name}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[#ED7600] font-bold text-sm whitespace-nowrap">Rs {ad.price}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm whitespace-nowrap ${
                            ad.payment_status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                            ad.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            ad.payment_status === 'failed' ? 'bg-red-100 text-red-700 border border-red-200' :
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {ad.payment_status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm whitespace-nowrap ${
                            ad.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' :
                            ad.status === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            ad.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                            ad.status === 'expired' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                            'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {ad.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs text-gray-600 space-y-1 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Start:</span>
                              <span className="font-medium">{formatDate(ad.start_date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">End:</span>
                              <span className="font-medium">{formatDate(ad.end_date)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-gray-700 whitespace-nowrap">
                            <FiEye className="text-blue-500" size={16} />
                            <span className="font-semibold text-sm">{ad.impressions || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 whitespace-nowrap">
                            <button
                              onClick={() => openEditModal(ad)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-105 shadow-sm hover:shadow"
                              title="Edit Advertisement"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openDeleteModal(ad)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-105 shadow-sm hover:shadow"
                              title="Delete Advertisement"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button
                className="px-6 py-2.5 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] text-white rounded-lg hover:from-[#1e2a3a] hover:to-[#0f1419] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <span className="text-gray-700 font-semibold text-base bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                Page {page} of {pagination.total_pages}
              </span>
              <button
                className="px-6 py-2.5 bg-gradient-to-r from-[#2F3D57] to-[#1e2a3a] text-white rounded-lg hover:from-[#1e2a3a] hover:to-[#0f1419] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                disabled={page === pagination.total_pages}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Modal for Approve/Reject/Edit/Delete */}
        {showModal && selectedAd && (
        <div className="fixed inset-0 bg-[#2F3D57]/80 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#2F3D57] text-white">
              <h2 className="text-2xl font-bold">
                {modalAction === 'approve' && 'Approve Advertisement'}
                {modalAction === 'reject' && 'Reject Advertisement'}
                {modalAction === 'edit' && 'Edit Advertisement'}
                {modalAction === 'delete' && 'Delete Advertisement'}
              </h2>
              <button className="text-white hover:text-gray-300 text-3xl leading-none" onClick={closeModal}>&times;</button>
            </div>

            <div className="p-6">
              {(modalAction === 'approve' || modalAction === 'reject' || modalAction === 'delete') && (
                <div className="mb-6 text-center">
                  <img
                    src={selectedAd.featured_image || '/placeholder-ad.jpg'}
                    alt={selectedAd.title}
                    className="w-full max-h-64 object-cover rounded-lg mb-4"
                    onError={(e) => { e.target.src = '/placeholder-ad.jpg'; }}
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedAd.title}</h3>
                  <p className="text-gray-600">
                    {selectedAd.plan_name} plan - Rs {selectedAd.price}
                  </p>
                </div>
              )}

              {modalAction === 'reject' && (
                <div className="mb-4">
                  <label htmlFor="admin_notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="admin_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows="4"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              )}

              {modalAction === 'edit' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link URL
                    </label>
                    <input
                      type="url"
                      value={editForm.link_url}
                      onChange={(e) => setEditForm({...editForm, link_url: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Featured Image URL
                    </label>
                    <input
                      type="url"
                      value={editForm.featured_image}
                      onChange={(e) => setEditForm({...editForm, featured_image: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    {editForm.featured_image && (
                      <img
                        src={editForm.featured_image}
                        alt="Preview"
                        className="mt-2 w-full max-h-48 object-cover rounded-lg"
                        onError={(e) => { e.target.src = '/placeholder-ad.jpg'; }}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active (Approved)</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Status (Read-only)
                    </label>
                    <input
                      type="text"
                      value={selectedAd.payment_status || 'pending'}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-200 text-gray-600 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Payment status is controlled by Stripe and cannot be edited directly.
                    </p>
                  </div>
                </div>
              )}

              {modalAction === 'delete' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">
                    Are you sure you want to delete this advertisement? This action cannot be undone.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button 
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                onClick={closeModal}
                disabled={processing}
              >
                Cancel
              </button>
              
              {modalAction === 'approve' && (
                <button 
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
                  onClick={handleApprove}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>✓ Approve</>
                  )}
                </button>
              )}
              
              {modalAction === 'reject' && (
                <button 
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
                  onClick={handleReject}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>✕ Reject</>
                  )}
                </button>
              )}

              {modalAction === 'edit' && (
                <button 
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
                  onClick={handleEdit}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>💾 Save Changes</>
                  )}
                </button>
              )}

              {modalAction === 'delete' && (
                <button 
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
                  onClick={handleDelete}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>🗑 Delete</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdvertisementManagement;
