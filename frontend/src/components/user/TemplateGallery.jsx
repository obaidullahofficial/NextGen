import React, { useState, useEffect } from 'react';
import { FiFilter, FiCheckCircle, FiEye } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TemplateGallery = ({ onSelectTemplate, onGenerateNew, societyId }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlotSize, setSelectedPlotSize] = useState('all');
  const [filteredTemplates, setFilteredTemplates] = useState([]);

  const plotSizes = ['5 Marla', '6 Marla', '7 Marla', '10 Marla', '1 Kanal', '2 Kanal'];

  useEffect(() => {
    fetchTemplates();
  }, [societyId]);

  useEffect(() => {
    if (selectedPlotSize === 'all') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter(t => t.plot_size === selectedPlotSize));
    }
  }, [selectedPlotSize, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get society ID from props (for users) or from profile (for sub-admins)
      let finalSocietyId = societyId;
      
      if (!finalSocietyId) {
        // Sub-admin: get from their profile
        const profileResponse = await axios.get(`${API_URL}/society-profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        finalSocietyId = profileResponse.data?.profile?._id;
      }

      if (!finalSocietyId) {
        console.warn('No society ID found');
        setLoading(false);
        return;
      }

      console.log('[TemplateGallery] Fetching templates for society:', finalSocietyId);

      // Fetch templates
      const response = await axios.get(`${API_URL}/templates/society/${finalSocietyId}`);
      
      if (response.data.success) {
        setTemplates(response.data.templates || []);
        setFilteredTemplates(response.data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomCount = (template) => {
    const rooms = template.room_data || template.floor_plan_data?.rooms || [];
    return rooms.length;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🏠 Recommended Floor Plans
        </h2>
        <p className="text-gray-600">
          Society-approved templates that meet all compliance requirements
        </p>
      </div>

      {/* Plot Size Filter */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-gray-700">
          <FiFilter size={18} />
          <span className="font-medium">Filter by Plot Size:</span>
        </div>
        <button
          onClick={() => setSelectedPlotSize('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedPlotSize === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Sizes
        </button>
        {plotSizes.map((size) => (
          <button
            key={size}
            onClick={() => setSelectedPlotSize(size)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPlotSize === size
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-3">
            <FiCheckCircle size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Templates Available
          </h3>
          <p className="text-gray-500 mb-4">
            {selectedPlotSize === 'all'
              ? 'No approved templates yet for your society'
              : `No templates available for ${selectedPlotSize}`}
          </p>
          <button
            onClick={onGenerateNew}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            Generate Custom Floor Plan
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredTemplates.map((template) => (
              <div
                key={template._id}
                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FiCheckCircle size={16} />
                    <span className="text-xs font-semibold">✨ Recommended by Society</span>
                  </div>
                  <h3 className="font-bold text-lg">
                    {template.template_name || template.project_name}
                  </h3>
                </div>

                <div className="p-4">
                  {template.template_description && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-gray-700 italic">
                        "{template.template_description}"
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Plot Size:</span>
                      <span className="text-blue-600 font-semibold">{template.plot_size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Rooms:</span>
                      <span>{getRoomCount(template)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Dimensions:</span>
                      <span>{template.dimensions?.width || 1000} × {template.dimensions?.height || 1000} ft</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <FiCheckCircle size={16} />
                    Use This Template
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Generate Custom Button */}
          <div className="text-center pt-4 border-t">
            <p className="text-gray-600 mb-3">
              Don't see what you're looking for?
            </p>
            <button
              onClick={onGenerateNew}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2"
            >
              Generate Custom Floor Plan
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TemplateGallery;
