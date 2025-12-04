import React, { useState, useEffect } from 'react';
import advertisementAPI from '../../services/advertisementAPI';
import advertisementPlanAPI from '../../services/advertisementPlanAPI';
import './Advertisement.css';

const Advertisement = () => {
  const [plans, setPlans] = useState([]);
  const [myAds, setMyAds] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    featured_image: '',
    link_url: '',
    plan_id: ''
  });

  useEffect(() => {
    fetchPlans();
    fetchMyAds();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const result = await advertisementPlanAPI.getAllPlans(true);
      if (result.success) {
        setPlans(result.data || []);
      } else {
        setError(result.error || 'Failed to load plans');
      }
    } catch (err) {
      setError('Failed to load advertisement plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchMyAds = async () => {
    try {
      const result = await advertisementAPI.getAllAdvertisements(1, 10);
      if (result.success) {
        setMyAds(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image format
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (PNG, JPG, JPEG, GIF, or WebP)');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setError('');
      
      // Create preview and base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setImagePreview(base64);
        setFormData(prev => ({
          ...prev,
          featured_image: base64
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setFormData(prev => ({
      ...prev,
      plan_id: plan._id
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title || !formData.featured_image || !formData.plan_id) {
      setError('Title, advertisement image, and plan selection are required');
      return;
    }

    try {
      setLoading(true);
      const result = await advertisementAPI.createAdvertisement(formData);

      if (result.success) {
        setSuccess(`${result.message} Amount: $${result.price}`);
        setFormData({
          title: '',
          featured_image: '',
          link_url: '',
          plan_id: ''
        });
        setImageFile(null);
        setImagePreview('');
        setSelectedPlan(null);
        fetchMyAds();
        
        // Simulate payment redirect
        setTimeout(() => {
          alert(`Redirect to payment gateway for $${result.price}\nAdvertisement ID: ${result.advertisement_id}`);
        }, 1500);
      } else {
        setError(result.error || 'Failed to create advertisement');
      }
    } catch (err) {
      setError('Error creating advertisement: ' + err.message);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="advertisement-container">
      <div className="advertisement-header">
        <h1>Create Advertisement</h1>
        <p>Select a plan, upload your image, and submit for admin approval</p>
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

      {/* Plan Selection */}
      <div className="section-card">
        <h2>Step 1: Select a Plan</h2>
        {loadingPlans ? (
          <div className="loading-spinner">Loading plans...</div>
        ) : plans.length === 0 ? (
          <p className="no-data">No plans available</p>
        ) : (
          <div className="plans-grid">
            {plans.map(plan => (
              <div
                key={plan._id}
                className={`plan-card ${selectedPlan?._id === plan._id ? 'plan-selected' : ''}`}
                onClick={() => handlePlanSelect(plan)}
              >
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <span className="plan-price">${plan.price}</span>
                </div>
                <div className="plan-details">
                  <p><strong>{plan.duration_days}</strong> days</p>
                  {selectedPlan?._id === plan._id && (
                    <span className="plan-selected-badge">✓ Selected</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advertisement Form */}
      <div className="section-card">
        <h2>Step 2: Advertisement Details</h2>
        <form onSubmit={handleSubmit} className="ad-form">
          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter advertisement title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="featured_image">
              Featured Image <span className="required">*</span>
            </label>
            <input
              type="file"
              id="featured_image"
              name="featured_image"
              accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
              onChange={handleImageChange}
              className="file-input"
              required={!imagePreview}
            />
            <small>Upload your advertisement image (PNG, JPG, GIF, or WebP - Max 5MB)</small>
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Advertisement preview" className="image-preview" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setFormData(prev => ({ ...prev, featured_image: '' }));
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="link_url">
              Link URL <span className="optional">(Optional)</span>
            </label>
            <input
              type="url"
              id="link_url"
              name="link_url"
              value={formData.link_url}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
            <small>Users will be directed here when they click your ad</small>
          </div>

          {!selectedPlan && (
            <p className="form-warning">⚠ Please select a plan first</p>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !selectedPlan}
          >
            {loading ? 'Creating...' : 'Create Advertisement & Pay'}
          </button>
        </form>
      </div>

      {/* My Advertisements */}
      <div className="section-card">
        <h2>My Advertisements</h2>
        {myAds.length === 0 ? (
          <p className="no-data">No advertisements yet</p>
        ) : (
          <div className="ads-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Stats</th>
                </tr>
              </thead>
              <tbody>
                {myAds.map(ad => (
                  <tr key={ad._id}>
                    <td>
                      <div className="ad-title">
                        {ad.title}
                        {ad.link_url && <small>{ad.link_url}</small>}
                      </div>
                    </td>
                    <td>{ad.plan_name}</td>
                    <td>${ad.price}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(ad.status)}`}>
                        {ad.status}
                      </span>
                    </td>
                    <td>{formatDate(ad.start_date)}</td>
                    <td>{formatDate(ad.end_date)}</td>
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
        )}
      </div>
    </div>
  );
};

export default Advertisement;
