import React, { useState, useEffect } from 'react';
import advertisementPlanAPI from '../../services/advertisementPlanAPI';
import './AdvertisementPlanManagement.css';

const AdvertisementPlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    duration_days: '',
    price: '',
    is_active: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const result = await advertisementPlanAPI.getAllPlans(false);
      if (result.success) {
        setPlans(result.data || []);
      } else {
        setError(result.error || 'Failed to load plans');
      }
    } catch (err) {
      setError('Error loading plans');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        duration_days: plan.duration_days,
        price: plan.price,
        is_active: plan.is_active
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        duration_days: '',
        price: '',
        is_active: true
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const planData = {
        ...formData,
        duration_days: parseInt(formData.duration_days),
        price: parseFloat(formData.price)
      };

      let result;
      if (editingPlan) {
        result = await advertisementPlanAPI.updatePlan(editingPlan._id, planData);
      } else {
        result = await advertisementPlanAPI.createPlan(planData);
      }

      if (result.success) {
        setSuccess(result.message);
        closeModal();
        fetchPlans();
      } else {
        setError(result.error || 'Operation failed');
      }
    } catch (err) {
      setError('Error saving plan');
    }
  };

  const handleToggleStatus = async (planId) => {
    try {
      const result = await advertisementPlanAPI.togglePlanStatus(planId);
      if (result.success) {
        setSuccess('Plan status updated');
        fetchPlans();
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Error updating status');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const result = await advertisementPlanAPI.deletePlan(planId);
      if (result.success) {
        setSuccess('Plan deleted successfully');
        fetchPlans();
      } else {
        setError(result.error || 'Failed to delete plan');
      }
    } catch (err) {
      setError('Error deleting plan');
    }
  };

  return (
    <div className="plan-management-container">
      <div className="plan-management-header">
        <div>
          <h1>Advertisement Plan Management</h1>
          <p>Create and manage advertisement plans for users</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          + Create Plan
        </button>
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

      <div className="plans-section">
        {loading ? (
          <div className="loading-spinner">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="no-data">
            <p>No plans created yet</p>
            <button className="btn-secondary" onClick={() => openModal()}>
              Create First Plan
            </button>
          </div>
        ) : (
          <div className="plans-table">
            <table>
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <tr key={plan._id}>
                    <td>
                      <span className="plan-name">{plan.name}</span>
                    </td>
                    <td>{plan.duration_days} days</td>
                    <td className="price-cell">${plan.price}</td>
                    <td>
                      <span className={`status-badge ${plan.is_active ? 'status-active' : 'status-inactive'}`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(plan.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => openModal(plan)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-toggle"
                          onClick={() => handleToggleStatus(plan._id)}
                          title={plan.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {plan.is_active ? '🔒' : '🔓'}
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeletePlan(plan._id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="plan-form">
              <div className="form-group">
                <label htmlFor="name">
                  Plan Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., weekly, monthly, quarterly"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration_days">
                    Duration (Days) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="duration_days"
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={handleInputChange}
                    placeholder="7"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price">
                    Price ($) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="10.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>Active (visible to users)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementPlanManagement;
