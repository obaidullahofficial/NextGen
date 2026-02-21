import React, { useState, useEffect } from 'react';
import advertisementAPI from '../../services/advertisementAPI';

const AdApprovalManagement = () => {
  const [pendingAds, setPendingAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectingAd, setRejectingAd] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingAds();
  }, [page]);

  const fetchPendingAds = async () => {
    setLoading(true);
    try {
      const result = await advertisementAPI.getPendingAdvertisements(page, 10);
      if (result.success) {
        setPendingAds(result.data);
        setPagination(result.pagination);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load pending advertisements');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adId, display = true) => {
    setError('');
    setSuccess('');

    try {
      const result = await advertisementAPI.approveAdvertisement(adId, display);
      
      if (result.success) {
        setSuccess(`Advertisement ${display ? 'approved and displayed' : 'approved'} successfully`);
        fetchPendingAds();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to approve advertisement');
    }
  };

  const handleReject = async (adId) => {
    setError('');
    setSuccess('');

    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      const result = await advertisementAPI.rejectAdvertisement(adId, rejectionReason);
      
      if (result.success) {
        setSuccess('Advertisement rejected successfully');
        setRejectingAd(null);
        setRejectionReason('');
        fetchPendingAds();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to reject advertisement');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="ad-approval-container">
      <div className="page-header">
        <h1>Advertisement Approval</h1>
        <p>Review and approve pending advertisement requests</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="close-btn">×</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Pending Approval</span>
          <span className="stat-value">{pagination.total_count || 0}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading pending advertisements...</div>
      ) : (
        <>
          {pendingAds.length === 0 ? (
            <div className="no-data">
              <div className="icon">📭</div>
              <h2>No Pending Advertisements</h2>
              <p>All advertisements have been reviewed!</p>
            </div>
          ) : (
            <>
              <div className="ads-grid">
                {pendingAds.map((ad) => (
                  <div key={ad._id} className="ad-card">
                    {/* Ad Image */}
                    <div className="ad-image">
                      {ad.ad_picture ? (
                        <img src={ad.ad_picture} alt={ad.title} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>

                    {/* Ad Content */}
                    <div className="ad-content">
                      <h3 className="ad-title">{ad.title}</h3>
                      
                      {ad.description && (
                        <p className="ad-description">{ad.description}</p>
                      )}

                      {/* Meta Info */}
                      <div className="ad-meta">
                        <div className="meta-item">
                          <span className="label">Submitted by:</span>
                          <span className="value">{ad.created_by}</span>
                        </div>
                        <div className="meta-item">
                          <span className="label">Plan:</span>
                          <span className="value badge-plan">{ad.plan_name}</span>
                        </div>
                        <div className="meta-item">
                          <span className="label">Submitted:</span>
                          <span className="value">{formatDate(ad.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {rejectingAd === ad._id ? (
                        <div className="reject-form">
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Provide a reason for rejection..."
                            rows="3"
                            autoFocus
                          />
                          <div className="reject-actions">
                            <button 
                              onClick={() => {
                                setRejectingAd(null);
                                setRejectionReason('');
                              }}
                              className="btn btn-secondary"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleReject(ad._id)}
                              className="btn btn-danger"
                            >
                              Confirm Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="ad-actions">
                          <button 
                            onClick={() => handleApprove(ad._id, true)}
                            className="btn btn-success"
                            title="Approve and display immediately"
                          >
                            ✓ Approve & Display
                          </button>
                          <button 
                            onClick={() => handleApprove(ad._id, false)}
                            className="btn btn-info"
                            title="Approve but don't display yet"
                          >
                            ✓ Approve Only
                          </button>
                          <button 
                            onClick={() => setRejectingAd(ad._id)}
                            className="btn btn-danger"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn btn-secondary"
                  >
                    ← Previous
                  </button>
                  <span className="page-info">
                    Page {page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.total_pages}
                    className="btn btn-secondary"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdApprovalManagement;
