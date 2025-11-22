import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Check, X, Plus, Search, Filter, Star, Eye, Phone, MapPin, Building, Calendar, TrendingUp } from "lucide-react";
import advertisementAPI from "../../services/advertisementAPI";

const statusColors = {
  active: "bg-green-100 text-green-700 border-green-300",
  inactive: "bg-gray-100 text-gray-700 border-gray-300",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  expired: "bg-red-100 text-red-700 border-red-300",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status] || "bg-gray-100 text-gray-700 border-gray-300"}`}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
    </span>
  );
}

// Featured badge component
function FeaturedBadge({ isFeatured }) {
  if (!isFeatured) return null;
  
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
      <Star size={12} className="mr-1 fill-current" />
      Featured
    </span>
  );
}

// Plot sizes component
function PlotSizes({ sizes }) {
  if (!sizes || sizes.length === 0) return <span className="text-gray-500">N/A</span>;
  
  return (
    <div className="flex flex-wrap gap-1">
      {sizes.map((size, index) => (
        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200">
          {size}
        </span>
      ))}
    </div>
  );
}

// Advertisement Form Modal Component
function AdvertisementModal({ isOpen, onClose, advertisement, onSave, isEdit = false }) {
  const [formData, setFormData] = useState({
    society_name: '',
    location: '',
    plot_sizes: [],
    price_start: '',
    price_end: '',
    contact_number: '',
    description: '',
    facilities: '',
    installments_available: false,
    possession_status: 'ready',
    status: 'active',
    is_featured: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plotSizeOptions = ['5 Marla', '10 Marla', '1 Kanal', '2 Kanal', '5 Kanal', '1 Acre'];
  const possessionOptions = ['ready', 'under_construction', 'planning'];
  const statusOptions = ['active', 'inactive', 'pending', 'expired'];

  useEffect(() => {
    if (advertisement && isEdit) {
      setFormData({
        society_name: advertisement.society_name || '',
        location: advertisement.location || '',
        plot_sizes: advertisement.plot_sizes || [],
        price_start: advertisement.price_start || '',
        price_end: advertisement.price_end || '',
        contact_number: advertisement.contact_number || '',
        description: advertisement.description || '',
        facilities: advertisement.facilities || '',
        installments_available: advertisement.installments_available || false,
        possession_status: advertisement.possession_status || 'ready',
        status: advertisement.status || 'active',
        is_featured: advertisement.is_featured || false
      });
    } else {
      setFormData({
        society_name: '',
        location: '',
        plot_sizes: [],
        price_start: '',
        price_end: '',
        contact_number: '',
        description: '',
        facilities: '',
        installments_available: false,
        possession_status: 'ready',
        status: 'active',
        is_featured: false
      });
    }
    setError('');
  }, [advertisement, isEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      const submitData = {
        ...formData,
        price_start: parseFloat(formData.price_start),
        price_end: formData.price_end ? parseFloat(formData.price_end) : undefined
      };

      if (isEdit) {
        result = await advertisementAPI.updateAdvertisement(advertisement._id, submitData);
      } else {
        result = await advertisementAPI.createAdvertisement(submitData);
      }

      if (result.success) {
        onSave(result.data);
        onClose();
      } else {
        setError(result.error || `Failed to ${isEdit ? 'update' : 'create'} advertisement`);
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} advertisement:`, err);
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} advertisement. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePlotSizeToggle = (size) => {
    setFormData(prev => ({
      ...prev,
      plot_sizes: prev.plot_sizes.includes(size)
        ? prev.plot_sizes.filter(s => s !== size)
        : [...prev.plot_sizes, size]
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
                  {isEdit ? 'Edit Advertisement' : 'Create New Advertisement'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isEdit ? 'Update the advertisement information below' : 'Fill in the details to create a new advertisement'}
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
                  name="society_name"
                  value={formData.society_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter society name"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="mr-2 text-gray-500" size={16} />
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                Plot Sizes *
              </label>
              <div className="flex flex-wrap gap-3">
                {plotSizeOptions.map((size) => (
                  <label key={size} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.plot_sizes.includes(size)}
                      onChange={() => handlePlotSizeToggle(size)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  Starting Price (PKR) *
                </label>
                <input
                  type="number"
                  name="price_start"
                  value={formData.price_start}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter starting price"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  Ending Price (PKR)
                </label>
                <input
                  type="number"
                  name="price_end"
                  value={formData.price_end}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter ending price (optional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Phone className="mr-2 text-gray-500" size={16} />
                Contact Number *
              </label>
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter contact number"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Enter advertisement description"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                Facilities
              </label>
              <textarea
                name="facilities"
                value={formData.facilities}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Enter facilities (e.g., Gated community, electricity, gas, water, parks, schools & 24/7 security)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Possession Status
                </label>
                <select
                  name="possession_status"
                  value={formData.possession_status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {possessionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="installments_available"
                    checked={formData.installments_available}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Installments Available</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Advertisement</span>
                </label>
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
                    <span>{isEdit ? 'Update Advertisement' : 'Create Advertisement'}</span>
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

export default function AdvertisementManagement() {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAdvertisement, setSelectedAdvertisement] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total_advertisements: 0,
    active_advertisements: 0,
    featured_advertisements: 0,
    total_views: 0,
    total_contacts: 0
  });

  // Fetch all advertisements on component mount
  const fetchAdvertisements = async () => {
    setLoading(true);
    setError('');

    try {
      const filters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const result = await advertisementAPI.getAllAdvertisements(filters);
      
      if (result.success) {
        setAdvertisements(result.data || []);
        
        // Calculate stats immediately from the fetched data
        if (result.data && result.data.length > 0) {
          const totalAds = result.data.length;
          const activeAds = result.data.filter(ad => ad.status === 'active').length;
          const featuredAds = result.data.filter(ad => ad.is_featured).length;
          const totalViews = result.data.reduce((sum, ad) => sum + (ad.view_count || 0), 0);
          const totalContacts = result.data.reduce((sum, ad) => sum + (ad.contact_count || 0), 0);

          setStats(prevStats => ({
            ...prevStats,
            total_advertisements: totalAds,
            active_advertisements: activeAds,
            featured_advertisements: featuredAds,
            total_views: totalViews,
            total_contacts: totalContacts
          }));
        }
      } else {
        setError(result.error || 'Failed to fetch advertisements');
      }
    } catch (err) {
      console.error('Error fetching advertisements:', err);
      setError(err.message || 'Failed to fetch advertisements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch advertisement statistics
  const fetchStats = async () => {
    try {
      console.log('Fetching stats from API...');
      const result = await advertisementAPI.getAdvertisementStats();
      if (result.success && result.data) {
        console.log('Stats from API:', result.data);
        setStats(result.data);
      } else {
        // Fallback: calculate stats from current advertisements
        console.warn('Stats API failed, calculating from local data');
        calculateStatsFromAdvertisements();
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Fallback: calculate stats from current advertisements
      calculateStatsFromAdvertisements();
    }
  };

  // Calculate stats from current advertisements (fallback)
  const calculateStatsFromAdvertisements = () => {
    console.log('Calculating stats from advertisements:', advertisements.length);
    if (advertisements.length > 0) {
      const totalAds = advertisements.length;
      const activeAds = advertisements.filter(ad => ad.status === 'active').length;
      const featuredAds = advertisements.filter(ad => ad.is_featured).length;
      const totalViews = advertisements.reduce((sum, ad) => sum + (ad.view_count || 0), 0);
      const totalContacts = advertisements.reduce((sum, ad) => sum + (ad.contact_count || 0), 0);

      const newStats = {
        total_advertisements: totalAds,
        active_advertisements: activeAds,
        featured_advertisements: featuredAds,
        total_views: totalViews,
        total_contacts: totalContacts
      };

      console.log('Calculated stats:', newStats);
      setStats(prevStats => ({
        ...prevStats,
        ...newStats
      }));
    }
  };

  // Delete advertisement function
  const deleteAdvertisement = async (advertisementId, societyName) => {
    if (window.confirm(`Are you sure you want to delete the advertisement for "${societyName}"? This action cannot be undone.`)) {
      try {
        const result = await advertisementAPI.deleteAdvertisement(advertisementId);

        if (result.success) {
          alert('Advertisement deleted successfully');
          fetchAdvertisements(); // Refresh the list
          fetchStats(); // Refresh stats
        } else {
          alert(result.error || 'Failed to delete advertisement');
        }
      } catch (err) {
        console.error('Error deleting advertisement:', err);
        alert(err.message || 'Failed to delete advertisement. Please try again.');
      }
    }
  };

  // Handle create advertisement
  const handleCreateAdvertisement = () => {
    setSelectedAdvertisement(null);
    setShowCreateModal(true);
  };

  // Handle edit advertisement
  const handleEditAdvertisement = (advertisement) => {
    setSelectedAdvertisement(advertisement);
    setShowEditModal(true);
  };

  // Handle save (create/update)
  const handleSaveAdvertisement = (savedAdvertisement) => {
    fetchAdvertisements(); // Refresh the list
    fetchStats(); // Refresh stats
    alert(`Advertisement ${showEditModal ? 'updated' : 'created'} successfully!`);
  };

  // Close modals
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedAdvertisement(null);
  };

  // Toggle featured status
  const toggleFeaturedStatus = async (advertisementId, currentStatus) => {
    try {
      const result = await advertisementAPI.toggleFeaturedStatus(advertisementId, !currentStatus);

      if (result.success) {
        fetchAdvertisements(); // Refresh the list
        fetchStats(); // Refresh stats
        alert(`Advertisement ${!currentStatus ? 'marked as featured' : 'removed from featured'} successfully!`);
      } else {
        alert(result.error || 'Failed to update featured status');
      }
    } catch (err) {
      console.error('Error toggling featured status:', err);
      alert(err.message || 'Failed to update featured status. Please try again.');
    }
  };

  // Update advertisement status
  const updateAdvertisementStatus = async (advertisementId, newStatus) => {
    try {
      const result = await advertisementAPI.updateAdvertisementStatus(advertisementId, newStatus);

      if (result.success) {
        fetchAdvertisements(); // Refresh the list
        fetchStats(); // Refresh stats
        alert(`Advertisement status updated to ${newStatus} successfully!`);
      } else {
        alert(result.error || 'Failed to update advertisement status');
      }
    } catch (err) {
      console.error('Error updating advertisement status:', err);
      alert(err.message || 'Failed to update advertisement status. Please try again.');
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAdvertisements();
    fetchStats();
  }, [statusFilter]);

  // Update stats when advertisements change
  useEffect(() => {
    if (advertisements.length > 0) {
      // Always recalculate stats from current data to ensure accuracy
      calculateStatsFromAdvertisements();
    } else if (advertisements.length === 0) {
      // Reset stats when no advertisements
      setStats({
        total_advertisements: 0,
        active_advertisements: 0,
        featured_advertisements: 0,
        total_views: 0,
        total_contacts: 0
      });
    }
  }, [advertisements]); // Add calculateStatsFromAdvertisements to dependencies if needed

  // Filter advertisements based on search
  const filteredAdvertisements = advertisements.filter((ad) =>
    (ad.society_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (ad.location || '').toLowerCase().includes(search.toLowerCase()) ||
    (ad.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (ad.contact_number || '').toLowerCase().includes(search.toLowerCase())
  );

  const advertisementsPerPage = 6;
  const totalPages = Math.ceil(filteredAdvertisements.length / advertisementsPerPage);
  const displayedAdvertisements = filteredAdvertisements.slice(
    (currentPage - 1) * advertisementsPerPage,
    currentPage * advertisementsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `PKR ${(price / 100000).toFixed(1)} Lacs`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="w-full min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Advertisement Management</h1>
          <p className="text-lg text-gray-600">
            Manage and monitor property advertisements across the platform.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-semibold">Total Ads</p>
                <p className="text-3xl font-bold text-blue-800">{stats.total_advertisements}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-xl">
                <Building className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-semibold">Active Ads</p>
                <p className="text-3xl font-bold text-green-800">{stats.active_advertisements}</p>
              </div>
              <div className="bg-green-200 p-3 rounded-xl">
                <Check className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-semibold">Featured</p>
                <p className="text-3xl font-bold text-yellow-800">{stats.featured_advertisements}</p>
              </div>
              <div className="bg-yellow-200 p-3 rounded-xl">
                <Star className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-semibold">Total Views</p>
                <p className="text-3xl font-bold text-purple-800">{stats.total_views || 0}</p>
              </div>
              <div className="bg-purple-200 p-3 rounded-xl">
                <Eye className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-semibold">Contacts</p>
                <p className="text-3xl font-bold text-indigo-800">{stats.total_contacts || 0}</p>
              </div>
              <div className="bg-indigo-200 p-3 rounded-xl">
                <Phone className="text-indigo-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Advertisements</h2>
            <p className="text-gray-600 mt-1">Manage all property advertisements and their status</p>
          </div>
          <button
            onClick={handleCreateAdvertisement}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus size={16} />
            <span>Add New Advertisement</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-3 shadow-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search advertisements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-12 pr-8 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <span className="text-lg text-gray-600 font-medium">Loading advertisements...</span>
            </div>
          </div>
        )}

        {/* Advertisements Grid */}
        {!loading && (
          <div className="space-y-6">
            {displayedAdvertisements.length === 0 ? (
              <div className="text-center py-16">
                <Building className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No advertisements found</h3>
                <p className="text-gray-500">
                  {search || statusFilter !== 'all' ? 'Try adjusting your search criteria or create a new advertisement.' : 'Get started by creating your first advertisement.'}
                </p>
              </div>
            ) : (
              displayedAdvertisements.map((advertisement) => (
                <div key={advertisement._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {advertisement.society_name ? advertisement.society_name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div className="font-bold text-xl text-gray-900">{advertisement.society_name || 'Unknown Society'}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin size={14} className="mr-1" />
                              {advertisement.location || 'No location provided'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={advertisement.status} />
                          <FeaturedBadge isFeatured={advertisement.is_featured} />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Plot Sizes:</div>
                        <PlotSizes sizes={advertisement.plot_sizes} />
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Price Range:</div>
                        <div className="text-lg font-bold text-green-600">
                          {advertisement.price_end 
                            ? `${formatPrice(advertisement.price_start)} - ${formatPrice(advertisement.price_end)}`
                            : `Starting from ${formatPrice(advertisement.price_start)}`
                          }
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed line-clamp-3">
                        {advertisement.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Eye className="mr-1" size={14} />
                            {advertisement.view_count || 0} views
                          </div>
                          <div className="flex items-center">
                            <Phone className="mr-1" size={14} />
                            {advertisement.contact_count || 0} contacts
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-1" size={14} />
                            {formatDate(advertisement.created_at)}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          By: {advertisement.created_by || 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditAdvertisement(advertisement)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 group"
                          title="Edit Advertisement"
                        >
                          <Edit2 size={16} className="group-hover:scale-110 transition-transform duration-200" />
                        </button>
                        
                        <button
                          onClick={() => toggleFeaturedStatus(advertisement._id, advertisement.is_featured)}
                          className={`p-2 hover:bg-yellow-50 rounded-lg transition-colors duration-200 group ${advertisement.is_featured ? 'text-yellow-600' : 'text-gray-400'}`}
                          title={advertisement.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                        >
                          <Star size={16} className={`group-hover:scale-110 transition-transform duration-200 ${advertisement.is_featured ? 'fill-current' : ''}`} />
                        </button>
                        
                        <select
                          value={advertisement.status}
                          onChange={(e) => updateAdvertisementStatus(advertisement._id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="Change Status"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                          <option value="expired">Expired</option>
                        </select>
                        
                        <button
                          onClick={() => deleteAdvertisement(advertisement._id, advertisement.society_name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
                          title="Delete Advertisement"
                        >
                          <Trash2 size={16} className="group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Create Modal */}
        <AdvertisementModal
          isOpen={showCreateModal}
          onClose={closeModals}
          advertisement={null}
          onSave={handleSaveAdvertisement}
          isEdit={false}
        />

        {/* Edit Modal */}
        <AdvertisementModal
          isOpen={showEditModal}
          onClose={closeModals}
          advertisement={selectedAdvertisement}
          onSave={handleSaveAdvertisement}
          isEdit={true}
        />
      </div>
    </div>
  );
}