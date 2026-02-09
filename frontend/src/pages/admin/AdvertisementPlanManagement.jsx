import React, { useState, useEffect } from 'react';
import advertisementPlanAPI from '../../services/advertisementPlanAPI';

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
  const [priceError, setPriceError] = useState('');

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
    
    // Special handling for price validation
    if (name === 'price') {
      const numValue = parseFloat(value);
      if (value && numValue < 150) {
        setPriceError('Price must be at least 150 rupees');
      } else {
        setPriceError('');
      }
    }
    
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
    setPriceError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate price before submission
    const priceValue = parseFloat(formData.price);
    if (priceValue < 150) {
      setError('Price must be at least 150 rupees');
      return;
    }

    try {
      const planData = {
        ...formData,
        duration_days: parseInt(formData.duration_days),
        price: priceValue
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
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2F3D57] mb-2">Advertisement Plan Management</h1>
            <p className="text-gray-600">Create and manage advertisement plans for users</p>
          </div>
          <button 
            className="px-6 py-3 bg-[#2F3D57] text-white rounded-lg hover:bg-[#1e2a3a] transition-all font-medium shadow-lg"
            onClick={() => openModal()}
          >
            + Create Plan
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <span className="text-xl">⚠</span>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <span className="text-xl">✓</span>
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading plans...</div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No plans created yet</p>
              <button 
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium" 
                onClick={() => openModal()}
              >
                Create First Plan
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2F3D57] text-white">
                    <th className="px-6 py-4 text-left font-semibold">Plan Name</th>
                    <th className="px-6 py-4 text-left font-semibold">Duration</th>
                    <th className="px-6 py-4 text-left font-semibold">Price</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-left font-semibold">Created</th>
                    <th className="px-6 py-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{plan.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{plan.duration_days} days</td>
                      <td className="px-6 py-4 text-[#ED7600] font-bold">Rs {plan.price}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          plan.is_active 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-500 text-white'
                        }`}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{new Date(plan.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            className="p-2 hover:bg-blue-50 rounded transition-colors text-xl"
                            onClick={() => openModal(plan)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="p-2 hover:bg-orange-50 rounded transition-colors text-xl"
                            onClick={() => handleToggleStatus(plan._id)}
                            title={plan.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {plan.is_active ? '🔒' : '🔓'}
                          </button>
                          <button
                            className="p-2 hover:bg-red-50 rounded transition-colors text-xl"
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
          <div className="fixed inset-0 bg-[#2F3D57]/80 flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#2F3D57] text-white">
                <h2 className="text-2xl font-bold">
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </h2>
                <button className="text-white hover:text-gray-300 text-3xl leading-none" onClick={closeModal}>&times;</button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., weekly, monthly, quarterly"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (Days) <span className="text-red-500">*</span>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Price (Rs) <span className="text-red-500">*</span>
                      <span className="text-sm text-gray-500 font-normal ml-1">(Minimum: 150 Rs)</span>
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="150.00"
                      step="0.01"
                      min="150"
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 outline-none ${
                        priceError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {priceError && (
                      <p className="text-red-500 text-sm mt-1">{priceError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active (visible to users)</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button" 
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium" 
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-[#2F3D57] text-white rounded-lg hover:bg-[#1e2a3a] transition-all font-medium shadow-lg"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertisementPlanManagement;
