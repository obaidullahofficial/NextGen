import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaChartLine, FaFilter, FaSpinner } from "react-icons/fa";
import AddPlot from "../../components/subadmin/AddPlot";
import EditPlot from "../../components/subadmin/EditPlot";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useConfirm } from "../../hooks/useConfirm";
import { getPlots, createPlot, updatePlot, deletePlot } from "../../services/apiService";

const PlotManager = () => {
  // State management
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editPlot, setEditPlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [plotNumberFilter, setPlotNumberFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const { confirmState, showConfirm } = useConfirm();

  // Load plots on component mount
  useEffect(() => {
    loadPlots();
  }, []);

  // Function to load plots from API
  const loadPlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPlots();
      
      // Debug: Log the raw API response
      console.log('Raw API response:', response);
      
      // Extract the actual plots data from the response
      let plotsData = [];
      if (response.success && Array.isArray(response.data)) {
        plotsData = response.data;
      } else if (Array.isArray(response)) {
        plotsData = response;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      console.log('Sample plot data:', plotsData[0]);
      
      // Transform API data to match expected format
      const transformedPlots = plotsData.map(plot => ({
        id: plot._id,
        plotNumber: plot.plot_number || plot.plotNumber || `PL-${Math.floor(1000 + Math.random() * 9000)}`,
        name: plot.name || 'Residential Plot',
        type: plot.type || 'Residential',
        marla_size: plot.marla_size || 'N/A',
        area: plot.area || 'N/A',
        dimension_x: plot.dimension_x || 'N/A',
        dimension_y: plot.dimension_y || 'N/A',
        dimensions: plot.dimension_x && plot.dimension_y ? `${plot.dimension_x}ft x ${plot.dimension_y}ft` : 'N/A',
        price: plot.price || 'N/A',
        location: plot.location || 'N/A',
        status: plot.status || 'Available',
        image: plot.image || '',
        // For table display: show image status, but keep raw data in _originalData
        images: plot.image ? 'Has image' : 'No image',
        description: Array.isArray(plot.description) ? plot.description.join(', ') : (plot.description || 'No description'),
        contactName: plot.seller?.name || 'N/A',
        contactPhone: plot.seller?.phone || 'N/A',
        seller: plot.seller ? `${plot.seller.name || 'N/A'} (${plot.seller.phone || 'N/A'})` : 'N/A',
        amenities: Array.isArray(plot.amenities) ? plot.amenities.join(', ') : 'N/A',
        lastUpdated: plot.lastUpdated ? new Date(plot.lastUpdated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        createdDate: plot.createdAt ? new Date(plot.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        // Keep original data for API calls - this preserves the raw image data
        _originalData: plot
      }));
      
      setPlots(transformedPlots);
    } catch (err) {
      console.error('Error loading plots:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show success message temporarily
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Delete plot handler
  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Plot',
      message: 'Are you sure you want to delete this plot? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      await deletePlot(id);
      setPlots(plots.filter((plot) => plot.id !== id));
      showSuccess('Plot deleted successfully!');
    } catch (err) {
      console.error('Error deleting plot:', err);
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Edit plot handler
  const handleEdit = (plot) => {
    setEditPlot(plot._originalData || plot); // Use original data for editing
    setShowEditForm(true);
  };

  // Add plot handler
  const handleAdd = async (plotFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Check if it's FormData (from new components) or regular object (legacy)
      let finalFormData;
      
      if (plotFormData instanceof FormData) {
        // It's already FormData from the new component
        finalFormData = plotFormData;
        // Ensure type is set to Residential
        finalFormData.set('type', 'Residential');
        finalFormData.set('lastUpdated', new Date().toISOString());
      } else {
        // Legacy object format - convert to FormData or keep as object
        finalFormData = {
          ...plotFormData,
          type: "Residential",
          plotNumber: plotFormData.plot_number || `PL-${Math.floor(1000 + Math.random() * 9000)}`,
          lastUpdated: new Date().toISOString()
        };
      }

      console.log('[PlotManager] Creating plot with:', finalFormData instanceof FormData ? 'FormData' : 'Object');
      
      // Create new plot
      const result = await createPlot(finalFormData);
      
      // Reload plots to get the fresh data
      await loadPlots();
      showSuccess('Plot created successfully!');
      setShowAddForm(false);
      
      return result;
      
    } catch (err) {
      console.error('Error creating plot:', err);
      
      // Enhanced error handling for duplicate plot numbers
      if (err.message && err.message.includes('already exists')) {
        // This is a duplicate plot number error - let the AddPlot component handle it
        setError(null); // Don't show error in manager, let AddPlot show it
      } else {
        // For other errors, show in manager
        setError(err.message);
      }
      
      throw err; // Re-throw so component can handle it
    } finally {
      setSubmitting(false);
    }
  };

  // Update plot handler
  const handleUpdate = async (plotFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('[PlotManager] Updating plot with:', plotFormData instanceof FormData ? 'FormData' : 'Object');
      
      // Update existing plot
      const result = await updatePlot(editPlot._id, plotFormData);
      
      // Reload plots to get the fresh data
      await loadPlots();
      showSuccess('Plot updated successfully!');
      setShowEditForm(false);
      setEditPlot(null);
      
      return result;
      
    } catch (err) {
      console.error('Error updating plot:', err);
      
      // Enhanced error handling for duplicate plot numbers
      if (err.message && err.message.includes('already exists')) {
        // This is a duplicate plot number error - let the EditPlot component handle it
        setError(null); // Don't show error in manager, let EditPlot show it
      } else {
        // For other errors, show in manager
        setError(err.message);
      }
      
      throw err; // Re-throw so component can handle it
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search functionality
  const filteredPlots = plots.filter(plot => {
    const matchesSearch = Object.values(plot).some(
      value => value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesFilter = filterStatus === "All" || plot.status === filterStatus;
    const matchesPlotNumber = plotNumberFilter === "" || 
      plot.plotNumber.toLowerCase().includes(plotNumberFilter.toLowerCase());
    
    return matchesSearch && matchesFilter && matchesPlotNumber;
  });

  // Stats calculations - only Available and Sold
  const totalResidential = plots.length;
  const available = plots.filter((p) => p.status === "Available").length;
  const sold = plots.filter((p) => p.status === "Sold").length;

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e6e9f0] text-[#2F3D57]">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2F3D57]">
          <FaChartLine className="inline mr-2 text-[#ED7600]" />
          Residential Plot Management Dashboard
        </h1>
        {loading && (
          <div className="flex items-center gap-2 text-[#ED7600]">
            <FaSpinner className="animate-spin" />
            <span>Loading plots...</span>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards - Removed Reserved */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-[#2F3D57] to-[#4a5a7a] text-white p-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition duration-300">
          <h3 className="text-sm font-medium">Total Residential Plots</h3>
          <p className="text-3xl font-bold mt-2">{totalResidential}</p>
        </div>
        <div className="bg-gradient-to-r from-[#ED7600] to-[#f5923e] text-white p-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition duration-300">
          <h3 className="text-sm font-medium">Available</h3>
          <p className="text-3xl font-bold mt-2">{available}</p>
        </div>
        <div className="bg-gradient-to-r from-[#28a745] to-[#20c997] text-white p-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition duration-300">
          <h3 className="text-sm font-medium">Sold</h3>
          <p className="text-3xl font-bold mt-2">{sold}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 p-4 bg-white rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by plot number..."
              value={plotNumberFilter}
              onChange={(e) => setPlotNumberFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-transparent"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 flex-grow">
              <FaFilter className="text-gray-400 mr-2" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#ED7600] rounded-lg w-full"
              >
                <option value="All">All Status</option>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#ED7600] text-white px-5 py-2 rounded-lg shadow-md hover:bg-[#D56900] transition flex items-center gap-2 whitespace-nowrap"
            >
              <FaPlus />
              Add Residential Plot
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#2F3D57] text-white">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs">Plot #</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Type</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Plot Size</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Area</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Dim X</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Dim Y</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Price</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Status</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Description</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Images</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Created</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Updated</th>
                <th className="px-4 py-3 text-right font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlots.length > 0 ? (
                filteredPlots.map((plot) => (
                  <tr key={plot.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-xs">{plot.plotNumber}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        {plot.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{plot.marla_size || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs">{plot.area}</td>
                    <td className="px-4 py-3 text-xs">{plot.dimension_x}</td>
                    <td className="px-4 py-3 text-xs">{plot.dimension_y}</td>
                    <td className="px-4 py-3 font-medium text-xs">{plot.price}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        plot.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {plot.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-40 truncate" title={plot.description}>{plot.description}</td>
                    <td className="px-4 py-3 text-xs max-w-32 truncate" title={plot.images}>{plot.images}</td>
                    <td className="px-4 py-3 text-xs">{plot.createdDate}</td>
                    <td className="px-4 py-3 text-xs">{plot.lastUpdated}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(plot)}
                          disabled={submitting}
                          className={`text-[#2F3D57] hover:text-[#ED7600] transition p-1 rounded-full hover:bg-gray-100 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(plot.id)}
                          disabled={deletingId === plot.id}
                          className={`text-red-500 hover:text-red-700 transition p-1 rounded-full hover:bg-gray-100 ${deletingId === plot.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Delete"
                        >
                          {deletingId === plot.id ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : loading ? (
                <tr>
                  <td colSpan="16" className="px-6 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="animate-spin" />
                      <span>Loading plots...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="16" className="px-6 py-4 text-center text-gray-500">
                    {error ? 'Failed to load plots. Please try again.' : 'No residential plots found matching your criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#2F3D57]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <AddPlot
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
              plotType="Residential"
            />
          </div>
        </div>
      )}
      
      {/* Edit Form Modal */}
      {showEditForm && editPlot && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#2F3D57]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <EditPlot
              plot={editPlot}
              onSubmit={handleUpdate}
              onCancel={() => {
                setShowEditForm(false);
                setEditPlot(null);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={confirmState.onClose}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
      />
    </div>
  );
};

export default PlotManager;
