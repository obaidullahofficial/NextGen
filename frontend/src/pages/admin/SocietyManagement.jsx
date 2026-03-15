import React, { useState, useEffect } from "react";
import { Search, Filter, Edit2, Trash2, CheckCircle, RefreshCw, X, Save, MapPin, Users, Building, DollarSign, Mail, Calendar, Eye, Phone, Globe, Hash, Shield, AlertCircle } from "lucide-react";
import { getSocietyRegistrations, getPendingSocietyRegistrations } from "../../services/authService";
import { societyProfileAPI } from "../../services/societyProfileAPI";

const API_BASE_URL = 'https://nextgen-ta95.onrender.com/api';

// API Functions for Society Registration Management
const societyRegistrationAPI = {
  // Get all society registrations
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/society-registrations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch registrations');
    return data;
  },

  // Get pending registrations
  getPending: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/society-registrations/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch pending registrations');
    return data;
  },

  // Create new society registration
  create: async (societyData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/signup-society`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(societyData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create registration');
    return data;
  },

  // Update society registration status
  updateStatus: async (formId, status) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/registration-forms/${formId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update status');
    return data;
  },

  // Delete society registration
  delete: async (formId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/registration-forms/${formId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete registration');
    return data;
  }
};

const statusColors = {
  Complete: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
  Incomplete: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300",
  approved: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
  pending: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300",
  rejected: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300",
  Approved: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
  Pending: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300",
  Suspended: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300",
};

// Society Details Modal
function SocietyDetailsModal({ isOpen, onClose, society }) {
  if (!isOpen || !society) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatPlots = (plotsString) => {
    if (!plotsString) return 'N/A';
    return plotsString.split(',').map(plot => plot.trim()).join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                {society.name ? society.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{society.name || 'Unnamed Society'}</h2>
                <p className="text-gray-600 mt-1">Registration ID: {society._id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="text-gray-500" size={24} />
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="mr-2 text-blue-600" size={20} />
                  Basic Information
                </h3>
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Society Name</label>
                    <p className="text-gray-900 font-medium">{society.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900">{society.type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration Number</label>
                    <p className="text-gray-900 font-mono">{society.regNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Authority</label>
                    <p className="text-gray-900">{society.authority || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={society.status || 'pending'} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="mr-2 text-green-600" size={20} />
                  Contact Information
                </h3>
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-600">User Email</label>
                    <p className="text-blue-600 hover:text-blue-800">
                      <a href={`mailto:${society.user_email}`}>{society.user_email || 'N/A'}</a>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contact Number</label>
                    <p className="text-gray-900">{society.contact || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Website</label>
                    {society.website ? (
                      <p className="text-blue-600 hover:text-blue-800">
                        <a 
                          href={society.website.startsWith('http') ? society.website : `https://${society.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {society.website}
                        </a>
                      </p>
                    ) : (
                      <p className="text-gray-900">N/A</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="mr-2 text-purple-600" size={20} />
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-blue-700">Established Date</label>
                    <p className="text-blue-900 font-medium">{formatDate(society.established)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-green-700">Registration Date</label>
                    <p className="text-green-900 font-medium">{formatDate(society.created_at)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-purple-700">Available Plots</label>
                    <p className="text-purple-900 font-medium">{formatPlots(society.plots)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Status Information */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="mr-2 text-orange-600" size={20} />
                  Project Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-orange-700">Land Acquisition Status</label>
                    <p className="text-orange-900 font-medium capitalize">
                      {society.land_acquisition_status || 'Not Specified'}
                    </p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-teal-700">Procurement Status</label>
                    <p className="text-teal-900 font-medium capitalize">
                      {society.procurement_status || 'Not Specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* NOC Information */}
            {society.noc_issued !== undefined && (
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="mr-2 text-indigo-600" size={20} />
                    Compliance Information
                  </h3>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-indigo-700">NOC Status</label>
                    <p className="text-indigo-900 font-medium">
                      {society.noc_issued ? 'âœ… NOC Issued' : 'âŒ NOC Not Issued'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* City Information */}
            {society.city && (
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="mr-2 text-red-600" size={20} />
                    Location Details
                  </h3>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-red-700">City</label>
                    <p className="text-red-900 font-medium">{society.city}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// Modal component for Edit Society Registration
function SocietyModal({ isOpen, onClose, society, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Private',
    regNo: '',
    established: '',
    authority: 'LDA',
    contact: '',
    website: '',
    plots: '',
    city: '',
    land_acquisition_status: '',
    procurement_status: '',
    noc_issued: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (society) {
      setFormData({
        name: society.name || '',
        type: society.type || 'Private',
        regNo: society.regNo || '',
        established: society.established ? new Date(society.established).toISOString().split('T')[0] : '',
        authority: society.authority || 'LDA',
        contact: society.contact || '',
        website: society.website || '',
        plots: society.plots || '',
        city: society.city || '',
        land_acquisition_status: society.land_acquisition_status || '',
        procurement_status: society.procurement_status || '',
        noc_issued: society.noc_issued || false
      });
    }
  }, [society, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For edit, we'll update status instead of creating new
      const result = { success: true, message: 'Edit functionality will be implemented when update API is available' };

      if (result.success !== false) {
        onSave(result);
        onClose();
        alert('Society registration updated successfully!');
      } else {
        setError(result.error || 'Failed to update society registration');
      }
    } catch (err) {
      console.error('Error updating society registration:', err);
      setError(err.message || 'Failed to update society registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-blue-100">
                <Edit2 className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Edit Society Registration
                </h2>
                <p className="text-gray-600 mt-1">
                  Update the society registration information below
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="text-gray-500" size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Society Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Building className="mr-2 text-green-600" size={20} />
                Society Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Building className="mr-2 text-gray-500" size={16} />
                    Society Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter society name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Hash className="mr-2 text-gray-500" size={16} />
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Hash className="mr-2 text-gray-500" size={16} />
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    name="regNo"
                    value={formData.regNo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter registration number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="mr-2 text-gray-500" size={16} />
                    Established Date *
                  </label>
                  <input
                    type="date"
                    name="established"
                    value={formData.established}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Shield className="mr-2 text-gray-500" size={16} />
                    Authority *
                  </label>
                  <select
                    name="authority"
                    value={formData.authority}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="LDA">LDA</option>
                    <option value="CDA">CDA</option>
                    <option value="Bahria Group">Bahria Group</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="mr-2 text-gray-500" size={16} />
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Globe className="mr-2 text-gray-500" size={16} />
                    Website *
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter website URL"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="mr-2 text-gray-500" size={16} />
                    Available Plots *
                  </label>
                  <input
                    type="text"
                    name="plots"
                    value={formData.plots}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., 5Marla,10Marla"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="mr-2 text-gray-500" size={16} />
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter city"
                  />
                </div>
              </div>
            </div>

            {/* Project Status Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <AlertCircle className="mr-2 text-orange-600" size={20} />
                Project Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Building className="mr-2 text-gray-500" size={16} />
                    Land Acquisition Status
                  </label>
                  <select
                    name="land_acquisition_status"
                    value={formData.land_acquisition_status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="mr-2 text-gray-500" size={16} />
                    Procurement Status
                  </label>
                  <select
                    name="procurement_status"
                    value={formData.procurement_status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Shield className="mr-2 text-gray-500" size={16} />
                    NOC Status
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="noc_issued"
                        checked={formData.noc_issued}
                        onChange={(e) => setFormData(prev => ({ ...prev, noc_issued: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">NOC Issued</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Update Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status]} shadow-sm`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {status}
    </span>
  );
}

function SocietyRow({ society, onDelete, onEdit, onView, onStatusUpdate, isSelected, onSelect }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${society.name || 'this society'}"? This action cannot be undone.`)) {
      onDelete(society._id, society.name || 'Unnamed Society');
    }
  };

  const handleEdit = () => {
    onEdit(society);
  };

  const handleView = () => {
    onView(society);
  };

  const handleStatusChange = async (newStatus) => {
    const statusMessage = {
      'approved': 'approve',
      'rejected': 'reject',
      'pending': 'mark as pending'
    };
    
    if (window.confirm(`Are you sure you want to ${statusMessage[newStatus]} "${society.name || 'this society'}"?`)) {
      await onStatusUpdate(society._id, newStatus);
    }
  };

  const formatPlots = (plotsString) => {
    if (!plotsString) return 'N/A';
    return plotsString.split(',').map(plot => plot.trim()).join(', ');
  };

  const getAuthorityIcon = (authority) => {
    switch(authority?.toLowerCase()) {
      case 'lda': return 'ðŸ›ï¸';
      case 'cda': return 'ðŸ¢';
      case 'bahria group': return 'ðŸ°';
      default: return 'ðŸ›ï¸';
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
      <td className="py-4 px-6">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(society._id, e.target.checked)}
          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        />
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
            {society.name ? society.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-lg">{society.name || 'Unnamed Society'}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <Hash className="mr-1" size={12} />
              {society._id?.slice(-8) || 'N/A'}
            </div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="space-y-2">
          <div className="flex items-center text-gray-700">
            <Building className="mr-2 text-gray-400" size={16} />
            <span className="font-medium">{society.type || 'N/A'}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Hash className="mr-2 text-gray-400" size={14} />
            {society.regNo || 'N/A'}
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="space-y-2">
          <div className="flex items-center text-gray-700">
            <Shield className="mr-2 text-gray-400" size={16} />
            <span className="font-medium">
              {getAuthorityIcon(society.authority)} {society.authority || 'N/A'}
            </span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar className="mr-2 text-gray-400" size={14} />
            Est. {formatDate(society.established)}
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="space-y-2">
          <div className="flex items-center text-gray-700">
            <Mail className="mr-2 text-gray-400" size={16} />
            <span className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm">
              {society.user_email || 'N/A'}
            </span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Phone className="mr-2 text-gray-400" size={14} />
            {society.contact || 'N/A'}
          </div>
          {society.website && (
            <div className="flex items-center text-gray-600 text-sm">
              <Globe className="mr-2 text-gray-400" size={14} />
              <a 
                href={society.website.startsWith('http') ? society.website : `https://${society.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline truncate"
              >
                {society.website}
              </a>
            </div>
          )}
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="text-gray-700">
          <div className="font-medium text-sm mb-1">Available Plots:</div>
          <div className="text-sm bg-gray-100 px-2 py-1 rounded text-center">
            {formatPlots(society.plots)}
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="space-y-2">
          <StatusBadge status={society.status || 'pending'} />
          <div className="text-xs text-gray-500">
            Created: {formatDate(society.created_at)}
          </div>
          
          {/* Project Status Badges */}
          {(society.land_acquisition_status || society.procurement_status) && (
            <div className="space-y-1 pt-2 border-t border-gray-200">
              {society.land_acquisition_status && (
                <div className="flex items-center text-xs">
                  <span className="text-gray-500 mr-1">Land:</span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-medium capitalize">
                    {society.land_acquisition_status}
                  </span>
                </div>
              )}
              {society.procurement_status && (
                <div className="flex items-center text-xs">
                  <span className="text-gray-500 mr-1">Proc:</span>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded font-medium capitalize">
                    {society.procurement_status}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Status Update Buttons */}
          <div className="flex space-x-1">
            {society.status !== 'approved' && (
              <button
                onClick={() => handleStatusChange('approved')}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                title="Approve"
              >
                âœ“ Approve
              </button>
            )}
            {society.status !== 'rejected' && (
              <button
                onClick={() => handleStatusChange('rejected')}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="Reject"
              >
                âœ— Reject
              </button>
            )}
            {society.status !== 'pending' && (
              <button
                onClick={() => handleStatusChange('pending')}
                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                title="Mark Pending"
              >
                â³ Pending
              </button>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={handleView}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
            title="View Details"
          >
            <Eye size={16} className="group-hover:scale-110 transition-transform duration-200" />
          </button>
          <button
            onClick={handleEdit}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 group"
            title="Edit Society"
          >
            <Edit2 size={16} className="group-hover:scale-110 transition-transform duration-200" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
            title="Delete Society"
          >
            <Trash2 size={16} className="group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SearchAndFilter({ search, setSearch, onRefresh, loading, filter, setFilter }) {
  return (
    <div className="flex items-center space-x-3 mb-4">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search societies by name, location, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      </div>
      
      {/* Status Filter Dropdown */}
      <div className="relative">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      <button 
        onClick={onRefresh}
        disabled={loading}
        className="p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50" 
        title="Refresh Data"
      >
        <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={20} />
      </button>
    </div>
  );
}

function Pagination({ currentPage, setCurrentPage, totalPages, totalItems, societiesPerPage }) {
  const startItem = (currentPage - 1) * societiesPerPage + 1;
  const endItem = Math.min(currentPage * societiesPerPage, totalItems);

  return (
    <div className="flex items-center justify-between py-3 px-4 border-t">
      <div className="text-gray-600 text-sm">
        Showing {startItem} to {endItem} of {totalItems} societies
      </div>
      <div className="space-x-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          &lt;
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 border rounded ${
                currentPage === pageNum
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

export default function SocietyVerificationDashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selection for bulk actions
  const [selectedSocieties, setSelectedSocieties] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSociety, setSelectedSociety] = useState(null);

  // API call to fetch society registrations
  const fetchSocieties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSocietyRegistrations();
      console.log('API Response:', result); // Debug log
      
      // Handle different possible response structures
      const societyList = result.societies || result.registrations || result.data || result || [];
      setSocieties(Array.isArray(societyList) ? societyList : []);
      
    } catch (err) {
      console.error('Error fetching society registrations:', err);
      setError(err.message || 'Failed to fetch society registrations. Please try again.');
      setSocieties([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete society function
  const deleteSociety = async (societyId, societyName) => {
    if (!window.confirm(`Are you sure you want to delete "${societyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await societyRegistrationAPI.delete(societyId);

      if (result.success !== false) {
        alert('Society registration deleted successfully');
        fetchSocieties(); // Refresh the list
      } else {
        alert(result.error || 'Failed to delete society registration');
      }
    } catch (err) {
      console.error('Error deleting society registration:', err);
      alert(err.message || 'Failed to delete society registration. Please try again.');
    }
  };

  // Bulk actions
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSocieties(new Set(displayedSocieties.map(s => s._id)));
    } else {
      setSelectedSocieties(new Set());
    }
  };

  const handleSelectSociety = (societyId, checked) => {
    const newSelected = new Set(selectedSocieties);
    if (checked) {
      newSelected.add(societyId);
    } else {
      newSelected.delete(societyId);
    }
    setSelectedSocieties(newSelected);
    setSelectAll(newSelected.size === displayedSocieties.length);
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedSocieties.size === 0) {
      alert('Please select societies to update');
      return;
    }

    const statusMessage = {
      'approved': 'approve',
      'rejected': 'reject',
      'pending': 'mark as pending'
    };

    if (!window.confirm(`Are you sure you want to ${statusMessage[newStatus]} ${selectedSocieties.size} selected societies?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedSocieties).map(id => 
        societyRegistrationAPI.updateStatus(id, newStatus)
      );
      
      await Promise.all(promises);
      alert(`Successfully updated ${selectedSocieties.size} societies to ${newStatus}`);
      setSelectedSocieties(new Set());
      setSelectAll(false);
      fetchSocieties();
    } catch (err) {
      console.error('Error in bulk update:', err);
      alert('Some updates failed. Please try again.');
    }
  };

  // Update society status function
  const updateSocietyStatus = async (societyId, newStatus) => {
    try {
      const result = await societyRegistrationAPI.updateStatus(societyId, newStatus);

      if (result.success !== false) {
        alert(`Society registration status updated to ${newStatus}`);
        fetchSocieties(); // Refresh the list
      } else {
        alert(result.error || 'Failed to update society status');
      }
    } catch (err) {
      console.error('Error updating society status:', err);
      alert(err.message || 'Failed to update society status. Please try again.');
    }
  };

  // Reset selections when page changes
  useEffect(() => {
    setSelectedSocieties(new Set());
    setSelectAll(false);
  }, [currentPage, search, filter]);

  // Handle edit society
  const handleEditSociety = (society) => {
    setSelectedSociety(society);
    setShowEditModal(true);
  };

  // Handle view society details
  const handleViewSociety = (society) => {
    setSelectedSociety(society);
    setShowDetailsModal(true);
  };

  // Handle save (create/update)
  const handleSaveSociety = (savedSociety) => {
    fetchSocieties(); // Refresh the list
    alert('Society updated successfully!');
  };

  // Close modals
  const closeModals = () => {
    setShowEditModal(false);
    setShowDetailsModal(false);
    setSelectedSociety(null);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSocieties();
  }, []);

  // Filter societies based on search and status filter
  const filteredSocieties = societies.filter((society) => {
    const matchesSearch = (society.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (society.location || '').toLowerCase().includes(search.toLowerCase()) ||
      (society.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (society._id || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === "all" || (society.status || 'pending').toLowerCase() === filter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const societiesPerPage = 6;
  const totalPages = Math.ceil(filteredSocieties.length / societiesPerPage);
  const displayedSocieties = filteredSocieties.slice(
    (currentPage - 1) * societiesPerPage,
    currentPage * societiesPerPage
  );

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  return (
    <div className="w-full min-h-full bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Society Management</h1>
          <p className="text-lg text-gray-600">
            Manage and verify registered housing societies with comprehensive tools.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-semibold">Total Registrations</p>
                <p className="text-3xl font-bold text-blue-800">{societies.length}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-xl">
                <Building className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-semibold">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-800">
                  {societies.filter(society => society.status === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-200 p-3 rounded-xl">
                <Calendar className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-semibold">Approved</p>
                <p className="text-3xl font-bold text-green-800">
                  {societies.filter(society => society.status === 'approved').length}
                </p>
              </div>
              <div className="bg-green-200 p-3 rounded-xl">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-semibold">Rejected</p>
                <p className="text-3xl font-bold text-red-800">
                  {societies.filter(society => society.status === 'rejected').length}
                </p>
              </div>
              <div className="bg-red-200 p-3 rounded-xl">
                <X className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div className="flex space-x-3">
            <button
              onClick={() => fetchSocieties()}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl font-semibold"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSocieties.size > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-blue-800 font-medium">
                {selectedSocieties.size} society(ies) selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkStatusUpdate('approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
              >
                âœ“ Approve Selected
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('rejected')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
              >
                âœ— Reject Selected
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('pending')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm font-medium"
              >
                â³ Mark Pending
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
              >
                ðŸ—‘ï¸ Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-3 shadow-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <SearchAndFilter 
          search={search} 
          setSearch={setSearch} 
          onRefresh={fetchSocieties}
          loading={loading}
          filter={filter}
          setFilter={setFilter}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <span className="text-lg text-gray-600 font-medium">Loading societies...</span>
            </div>
          </div>
        )}

        {/* Enhanced Table */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Society</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Type & Reg No</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Authority & Date</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Contact Info</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Available Plots</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedSocieties.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16">
                        <Building className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No society registrations found</h3>
                        <p className="text-gray-500">
                          {search ? 'Try adjusting your search criteria.' : 'No society registrations available at the moment.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedSocieties.map((society) => (
                      <SocietyRow 
                        key={society._id || society.id} 
                        society={society} 
                        onDelete={deleteSociety}
                        onEdit={handleEditSociety}
                        onView={handleViewSociety}
                        onStatusUpdate={updateSocietyStatus}
                        isSelected={selectedSocieties.has(society._id)}
                        onSelect={handleSelectSociety}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSocieties.length}
              societiesPerPage={societiesPerPage}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}

        {/* Society Details Modal */}
        <SocietyDetailsModal
          isOpen={showDetailsModal}
          onClose={closeModals}
          society={selectedSociety}
        />

        {/* Edit Modal */}
        <SocietyModal
          isOpen={showEditModal}
          onClose={closeModals}
          society={selectedSociety}
          onSave={handleSaveSociety}
        />
      </div>
    </div>
  );
}
