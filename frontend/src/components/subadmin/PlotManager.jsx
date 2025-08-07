import React, { useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaChartLine, FaFilter } from "react-icons/fa";
import AddPlot from "./AddPlot";

const PlotManager = () => {
  const [plots, setPlots] = useState([
    {
      id: 1,
      plotNumber: "PL-1001",
      name: "Residential Plot A",
      type: "Residential",
      size: "10 Marla",
      dimensions: "50ft x 90ft",
      price: "PKR 50 Lakh",
      location: "Bahria Town, Islamabad",
      status: "Available",
      lastUpdated: "2023-05-15"
    },
    {
      id: 2,
      plotNumber: "PL-1002",
      name: "Residential Plot B",
      type: "Residential",
      size: "1 Kanal",
      dimensions: "60ft x 100ft",
      price: "PKR 1.2 Crore",
      location: "DHA Phase 5, Lahore",
      status: "Sold",
      lastUpdated: "2023-06-20"
    },
    {
      id: 3,
      plotNumber: "PL-1003",
      name: "Residential Plot C",
      type: "Residential",
      size: "8 Marla",
      dimensions: "40ft x 80ft",
      price: "PKR 35 Lakh",
      location: "Gulberg, Lahore",
      status: "Available",
      lastUpdated: "2023-07-10"
    },
    {
      id: 4,
      plotNumber: "PL-1004",
      name: "Residential Plot D",
      type: "Residential",
      size: "2 Kanal",
      dimensions: "100ft x 120ft",
      price: "PKR 2.5 Crore",
      location: "Murree Road, Islamabad",
      status: "Available",
      lastUpdated: "2023-04-05"
    },
    {
      id: 5,
      plotNumber: "PL-1005",
      name: "Residential Plot E",
      type: "Residential",
      size: "15 Marla",
      dimensions: "70ft x 95ft",
      price: "PKR 75 Lakh",
      location: "Clifton, Karachi",
      status: "Sold",
      lastUpdated: "2023-08-12"
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editPlot, setEditPlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [plotNumberFilter, setPlotNumberFilter] = useState("");

  const handleDelete = (id) => {
    setPlots(plots.filter((plot) => plot.id !== id));
  };

  const handleEdit = (plot) => {
    setEditPlot(plot);
    setShowAddForm(true);
  };

  const handleAddOrUpdate = (newPlot) => {
    // Ensure all plots are residential
    const plotData = {
      ...newPlot,
      type: "Residential"
    };

    if (editPlot) {
      setPlots(
        plots.map((p) => (p.id === editPlot.id ? { ...plotData, id: editPlot.id } : p))
      );
    } else {
      setPlots([...plots, { 
        ...plotData, 
        id: Date.now(), 
        plotNumber: `PL-${Math.floor(1000 + Math.random() * 9000)}`,
        lastUpdated: new Date().toISOString().split('T')[0] 
      }]);
    }
    setEditPlot(null);
    setShowAddForm(false);
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
    <div className="p-6 min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e6e9f0] text-[#2F3D57]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#2F3D57]">
          <FaChartLine className="inline mr-2 text-[#ED7600]" />
          Residential Plot Management Dashboard
        </h1>
      </div>

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
              placeholder="Search residential plots..."
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
                <th className="px-6 py-4 text-left font-medium">Plot Number</th>
                <th className="px-6 py-4 text-left font-medium">Plot Name</th>
                <th className="px-6 py-4 text-left font-medium">Type</th>
                <th className="px-6 py-4 text-left font-medium">Size</th>
                <th className="px-6 py-4 text-left font-medium">Dimensions</th>
                <th className="px-6 py-4 text-left font-medium">Price</th>
                <th className="px-6 py-4 text-left font-medium">Location</th>
                <th className="px-6 py-4 text-left font-medium">Status</th>
                <th className="px-6 py-4 text-left font-medium">Last Updated</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlots.length > 0 ? (
                filteredPlots.map((plot) => (
                  <tr key={plot.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium">{plot.plotNumber}</td>
                    <td className="px-6 py-4 font-medium">{plot.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        {plot.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">{plot.size}</td>
                    <td className="px-6 py-4">{plot.dimensions}</td>
                    <td className="px-6 py-4 font-medium">{plot.price}</td>
                    <td className="px-6 py-4">{plot.location}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        plot.status === "Available"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {plot.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{plot.lastUpdated}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(plot)}
                          className="text-[#2F3D57] hover:text-[#ED7600] transition p-1 rounded-full hover:bg-gray-100"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(plot.id)}
                          className="text-red-500 hover:text-red-700 transition p-1 rounded-full hover:bg-gray-100"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    No residential plots found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-10 backdrop-blur-lg bg-white/50 border border-white/30 flex items-center justify-center z-50 p-4 w-[700px] mx-auto rounded-2xl">
          <div className="bg-[#2F3D57] rounded-xl shadow-2xl w-full max-w-3xl max-h-[100vh] overflow-y-auto">
            <AddPlot
              onSubmit={handleAddOrUpdate}
              initialData={editPlot}
              onCancel={() => {
                setShowAddForm(false);
                setEditPlot(null);
              }}
              plotType="Residential" // Force residential type
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotManager;