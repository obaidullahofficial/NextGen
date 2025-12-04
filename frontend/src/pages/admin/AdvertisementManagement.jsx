import React, { useState, useEffect } from 'react';
import advertisementAPI from '../../services/advertisementAPI';
import './AdvertisementManagement.css';

const AdvertisementManagement = () => {
  const [pendingAds, setPendingAds] = useState([]);
  const [allAds, setAllAds] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  const [selectedAd, setSelectedAd] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(''); // 'approve' or 'reject'

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
      const result = await advertisementAPI.approveAdvertisement(selectedAd._id, adminNotes);
      if (result.success) {
        setSuccess('Advertisement approved successfully');
        closeModal();
        fetchPendingAds();
      } else {
        setError(result.error || 'Failed to approve advertisement');
      }
    } catch (err) {
      setError('Error approving advertisement');
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      const result = await advertisementAPI.rejectAdvertisement(selectedAd._id, adminNotes);
      if (result.success) {
        setSuccess('Advertisement rejected');
        closeModal();
        fetchPendingAds();
      } else {
        setError(result.error || 'Failed to reject advertisement');
      }
    } catch (err) {
      setError('Error rejecting advertisement');
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
    <div className="ad-management-container">
      <div className="ad-management-header">
        <div>
          <h1>Advertisement Management</h1>
          <p>Review and approve advertisement requests from users</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'tab-active' : ''}`}
          onClick={() => {
            setActiveTab('pending');
            setPage(1);
          }}
        >
          Pending Approval ({pendingAds.length})
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setPage(1);
          }}
        >
          All Advertisements
        </button>
      </div>

      {/* Content */}
      <div className="ads-content">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : activeTab === 'pending' ? (
          pendingAds.length === 0 ? (
            <div className="no-data">
              <p>No pending advertisements</p>
            </div>
          ) : (
            <div className="ads-grid">
              {pendingAds.map(ad => (
                <div key={ad._id} className="ad-card">
                  <div className="ad-image-container">
                    <img
                      src={ad.featured_image || '/placeholder-ad.jpg'}
                      alt={ad.title}
                      className="ad-image"
                      onError={(e) => { e.target.src = '/placeholder-ad.jpg'; }}
                    />
                    <div className="ad-plan-badge">{ad.plan_name}</div>
                  </div>
                  
                  <div className="ad-content">
                    <h3>{ad.title}</h3>
                    {ad.link_url && (
                      <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="ad-link">
                        {ad.link_url}
                      </a>
                    )}
                    
                    <div className="ad-meta">
                      <div className="ad-meta-item">
                        <span className="meta-label">User:</span>
                        <span>{ad.user_email}</span>
                      </div>
                      <div className="ad-meta-item">
                        <span className="meta-label">Price:</span>
                        <span className="price">${ad.price}</span>
                      </div>
                      <div className="ad-meta-item">
                        <span className="meta-label">Duration:</span>
                        <span>{formatDate(ad.start_date)} - {formatDate(ad.end_date)}</span>
                      </div>
                    </div>

                    <div className="ad-actions">
                      <button
                        className="btn-approve"
                        onClick={() => openApprovalModal(ad, 'approve')}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn-reject"
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
            <div className="no-data">
              <p>No advertisements found</p>
            </div>
          ) : (
            <div className="ads-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Dates</th>
                    <th>Stats</th>
                  </tr>
                </thead>
                <tbody>
                  {allAds.map(ad => (
                    <tr key={ad._id}>
                      <td>
                        <div className="ad-title">
                          {ad.title}
                          {ad.link_url && <small>{ad.link_url}</small>}
                        </div>
                      </td>
                      <td>{ad.user_email}</td>
                      <td>{ad.plan_name}</td>
                      <td className="price">${ad.price}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(ad.status)}`}>
                          {ad.status}
                        </span>
                      </td>
                      <td>
                        <div className="date-range">
                          <div>{formatDate(ad.start_date)}</div>
                          <div>{formatDate(ad.end_date)}</div>
                        </div>
                      </td>
                      <td>
                        <div className="ad-stats">
                          <span title="Clicks">👆 {ad.clicks || 0}</span>
                          <span title="Impressions">👁 {ad.impressions || 0}</span>
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
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page} of {pagination.total_pages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
              disabled={page === pagination.total_pages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showModal && selectedAd && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalAction === 'approve' ? 'Approve Advertisement' : 'Reject Advertisement'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="ad-preview">
                <img
                  src={selectedAd.featured_image || '/placeholder-ad.jpg'}
                  alt={selectedAd.title}
                  className="preview-image"
                  onError={(e) => { e.target.src = '/placeholder-ad.jpg'; }}
                />
                <h3>{selectedAd.title}</h3>
                <p className="ad-meta-text">
                  {selectedAd.plan_name} plan - ${selectedAd.price}
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="admin_notes">
                  Admin Notes {modalAction === 'reject' && <span className="required">*</span>}
                </label>
                <textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={modalAction === 'approve' ? 'Optional approval notes...' : 'Reason for rejection...'}
                  rows="4"
                  required={modalAction === 'reject'}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              {modalAction === 'approve' ? (
                <button className="btn-approve" onClick={handleApprove}>
                  ✓ Approve
                </button>
              ) : (
                <button className="btn-reject" onClick={handleReject}>
                  ✕ Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementManagement;
