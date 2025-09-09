import React, { useState, useEffect } from "react";
import { Search, Filter, Edit2, Trash2, CheckCircle, RefreshCw, Plus, X, Save, MapPin, Users, Building, DollarSign, Mail, Calendar, Eye } from "lucide-react";
import { societyProfileAPI } from "../../services/societyProfileAPI";

const statusColors = {
  Complete: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
  Incomplete: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300",
  Approved: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
  Pending: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300",
  Suspended: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300",
};

// Modal component for Create/Edit Society
function SocietyModal({ isOpen, onClose, society, onSave, isEdit = false }) {
  const [formData, setFormData] = useState({
    name: '',
    user_email: '',
    description: '',
    location: '',
    available_plots: '',
    price_range: '',
    society_logo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (society && isEdit) {
      setFormData({
        name: society.name || '',
        user_email: society.user_email || '',
        description: society.description || '',
        location: society.location || '',
        available_plots: society.available_plots || '',
        price_range: society.price_range || '',
        society_logo: society.society_logo || ''
      });
    } else {
      setFormData({
        name: '',
        user_email: '',
        description: '',
        location: '',
        available_plots: '',
        price_range: '',
        society_logo: ''
      });
    }
  }, [society, isEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isEdit) {
        result = await societyProfileAPI.update(society._id, formData);
      } else {
        result = await societyProfileAPI.create(formData);
      }

      if (result.success) {
        onSave(result.data);
        onClose();
      } else {
        setError(result.error || `Failed to ${isEdit ? 'update' : 'create'} society`);
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} society:`, err);
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} society. Please try again.`);
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl ${isEdit ? 'bg-blue-100' : 'bg-green-100'}`}>
                {isEdit ? <Edit2 className="text-blue-600" size={24} /> : <Plus className="text-green-600" size={24} />}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {isEdit ? 'Edit Society Profile' : 'Create New Society'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isEdit ? 'Update the society information below' : 'Fill in the details to create a new society profile'}
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
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Mail className="mr-2 text-gray-500" size={16} />
                  User Email *
                </label>
                <input
                  type="email"
                  name="user_email"
                  value={formData.user_email}
                  onChange={handleChange}
                  required
                  disabled={isEdit}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter user email"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="mr-2 text-gray-500" size={16} />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter location"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Users className="mr-2 text-gray-500" size={16} />
                  Available Plots
                </label>
                <input
                  type="text"
                  name="available_plots"
                  value={formData.available_plots}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter available plots"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="mr-2 text-gray-500" size={16} />
                  Price Range
                </label>
                <select
                  name="price_range"
                  value={formData.price_range}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select price range</option>
                  <option value="Budget">💰 Budget (Under 5 Lac)</option>
                  <option value="Mid-Range">💎 Mid-Range (5-15 Lac)</option>
                  <option value="Premium">⭐ Premium (15-50 Lac)</option>
                  <option value="Luxury">👑 Luxury (50+ Lac)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Edit2 className="mr-2 text-gray-500" size={16} />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Enter society description..."
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Eye className="mr-2 text-gray-500" size={16} />
                Society Logo URL
              </label>
              <input
                type="url"
                name="society_logo"
                value={formData.society_logo}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter logo URL"
              />
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
                    <span>{isEdit ? 'Update Society' : 'Create Society'}</span>
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

function SocietyRow({ society, onDelete, onEdit }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const status = society.is_complete ? 'Complete' : 'Incomplete';

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${society.name || 'this society'}"? This action cannot be undone.`)) {
      onDelete(society._id, society.name || 'Unnamed Society');
    }
  };

  const handleEdit = () => {
    onEdit(society);
  };

  const getPriceRangeDisplay = (priceRange) => {
    switch(priceRange) {
      case 'Budget': return '💰 Budget';
      case 'Mid-Range': return '💎 Mid-Range';
      case 'Premium': return '⭐ Premium';
      case 'Luxury': return '👑 Luxury';
      default: return priceRange || 'Not specified';
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-200">
      <td className="py-4 px-6">
        <div className="flex items-center space-x-3">
          {society.society_logo ? (
            <img 
              src={society.society_logo} 
              alt="Society Logo"
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${society.society_logo ? 'hidden' : 'flex'}`}>
            {society.name ? society.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{society.name || 'Unnamed Society'}</div>
            <div className="text-sm text-gray-500">ID: {society._id?.slice(-8) || 'N/A'}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center text-gray-700">
          <MapPin className="mr-2 text-gray-400" size={16} />
          {society.location || 'Not specified'}
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="text-gray-700">
          <div className="flex items-center mb-1">
            <Mail className="mr-2 text-gray-400" size={16} />
            {society.user_email || 'N/A'}
          </div>
          {(society.totalPlots || society.availablePlots) && (
            <div className="flex items-center text-sm text-gray-500">
              <Users className="mr-2 text-gray-400" size={14} />
              <span className="text-blue-600">Total: {society.totalPlots || 0}</span>
              <span className="mx-2">•</span>
              <span className="text-green-600">Available: {society.availablePlots || 0}</span>
            </div>
          )}
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center text-gray-700">
          <DollarSign className="mr-2 text-gray-400" size={16} />
          {getPriceRangeDisplay(society.price_range)}
        </div>
      </td>
      <td className="py-4 px-6">
        <StatusBadge status={status} />
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={handleEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
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

function SearchAndFilter({ search, setSearch, onRefresh, loading }) {
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
      <button 
        onClick={onRefresh}
        disabled={loading}
        className="p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50" 
        title="Refresh Data"
      >
        <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={20} />
      </button>
      <button className="p-2 border rounded-md hover:bg-gray-100" title="Filter">
        <Filter size={20} />
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
  const [currentPage, setCurrentPage] = useState(1);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSociety, setSelectedSociety] = useState(null);

  // API call to fetch society profiles
  const fetchSocieties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await societyProfileAPI.getAll();
      
      // Handle both old and new API response formats
      if (result.success && result.data) {
        setSocieties(Array.isArray(result.data) ? result.data : []);
      } else if (Array.isArray(result)) {
        // Fallback for old format
        setSocieties(result);
      } else {
        setSocieties([]);
      }
    } catch (err) {
      console.error('Error fetching societies:', err);
      setError(err.message || 'Failed to fetch societies. Please try again.');
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
      const result = await societyProfileAPI.delete(societyId);

      if (result.success) {
        alert('Society deleted successfully');
        fetchSocieties(); // Refresh the list
      } else {
        alert(result.error || 'Failed to delete society');
      }
    } catch (err) {
      console.error('Error deleting society:', err);
      alert(err.message || 'Failed to delete society. Please try again.');
    }
  };

  // Handle create society
  const handleCreateSociety = () => {
    setSelectedSociety(null);
    setShowCreateModal(true);
  };

  // Handle edit society
  const handleEditSociety = (society) => {
    setSelectedSociety(society);
    setShowEditModal(true);
  };

  // Handle save (create/update)
  const handleSaveSociety = (savedSociety) => {
    fetchSocieties(); // Refresh the list
    alert(`Society ${showEditModal ? 'updated' : 'created'} successfully!`);
  };

  // Close modals
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedSociety(null);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSocieties();
  }, []);

  // Filter societies based on search
  const filteredSocieties = societies.filter((society) =>
    (society.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (society.location || '').toLowerCase().includes(search.toLowerCase()) ||
    (society.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (society._id || '').toLowerCase().includes(search.toLowerCase())
  );

  const societiesPerPage = 6;
  const totalPages = Math.ceil(filteredSocieties.length / societiesPerPage);
  const displayedSocieties = filteredSocieties.slice(
    (currentPage - 1) * societiesPerPage,
    currentPage * societiesPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="w-full min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Society Management</h1>
          <p className="text-lg text-gray-600">
            Manage and verify registered housing societies with comprehensive tools.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-semibold">Total Societies</p>
                <p className="text-3xl font-bold text-blue-800">{societies.length}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-xl">
                <Building className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-semibold">Complete Profiles</p>
                <p className="text-3xl font-bold text-green-800">
                  {societies.filter(society => society.is_complete).length}
                </p>
              </div>
              <div className="bg-green-200 p-3 rounded-xl">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-semibold">Incomplete Profiles</p>
                <p className="text-3xl font-bold text-purple-800">
                  {societies.filter(society => !society.is_complete).length}
                </p>
              </div>
              <div className="bg-purple-200 p-3 rounded-xl">
                <Calendar className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Society Profiles</h2>
            <p className="text-gray-600 mt-1">Manage all society profiles and their information</p>
          </div>
          <button
            onClick={handleCreateSociety}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus size={20} />
            <span>Add New Society</span>
          </button>
        </div>

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
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Society</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Price Range</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedSocieties.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <Building className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No societies found</h3>
                        <p className="text-gray-500">
                          {search ? 'Try adjusting your search criteria or create a new society.' : 'Get started by creating your first society profile.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedSocieties.map((society) => (
                      <SocietyRow 
                        key={society._id} 
                        society={society} 
                        onDelete={deleteSociety}
                        onEdit={handleEditSociety}
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

        {/* Create Modal */}
        <SocietyModal
          isOpen={showCreateModal}
          onClose={closeModals}
          society={null}
          onSave={handleSaveSociety}
          isEdit={false}
        />

        {/* Edit Modal */}
        <SocietyModal
          isOpen={showEditModal}
          onClose={closeModals}
          society={selectedSociety}
          onSave={handleSaveSociety}
          isEdit={true}
        />
      </div>
    </div>
  );
}
