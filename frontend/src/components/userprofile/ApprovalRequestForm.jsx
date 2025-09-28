import React, { useState, useEffect } from 'react';
import { FiUpload, FiFileText, FiSend } from 'react-icons/fi';
import { userProfileAPI, createApprovalRequestFormData } from '../../services/userProfileAPI';

// MOCK DATA: In a real application, this list of plots would come from an API call.
const MOCK_AVAILABLE_PLOTS = [
  { id: 'PL-1001', details: 'Commercial Plot A, 10 Marla', area: '10 Marla' },
  { id: 'PL-1008', details: 'Residential Plot Y, 8 Marla', area: '8 Marla' },
  { id: 'PL-2055', details: 'Residential Plot B, 1 Kanal', area: '1 Kanal' },
  { id: 'PL-3102', details: 'Corner Plot C, 5 Marla', area: '5 Marla' },
];

const ApprovalRequestForm = () => {
  // State to manage all form inputs
  const [selectedPlotId, setSelectedPlotId] = useState(MOCK_AVAILABLE_PLOTS[0].id);
  const [designType, setDesignType] = useState('');
  const [floorPlanFile, setFloorPlanFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State for the derived plot details, to display them in the UI
  const [selectedPlotDetails, setSelectedPlotDetails] = useState(MOCK_AVAILABLE_PLOTS[0]);

  // This effect updates the displayed plot details whenever the user selects a new plot
  useEffect(() => {
    const plot = MOCK_AVAILABLE_PLOTS.find(p => p.id === selectedPlotId);
    if (plot) {
      setSelectedPlotDetails(plot);
    }
  }, [selectedPlotId]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFloorPlanFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // --- Data Validation ---
    if (!selectedPlotId || !designType || !floorPlanFile) {
      setMessage({ type: 'error', text: 'Please fill out all required fields and upload a floor plan.' });
      setLoading(false);
      return;
    }

    try {
      // --- Prepare the data for submission ---
      const requestData = {
        plotId: selectedPlotId,
        plotDetails: selectedPlotDetails.details,
        area: selectedPlotDetails.area,
        designType,
        notes,
      };

      const formData = createApprovalRequestFormData(requestData, floorPlanFile);
      
      const response = await userProfileAPI.createApprovalRequest(formData);
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message });
        // Reset form after successful submission
        setDesignType('');
        setFloorPlanFile(null);
        setNotes('');
        // Reset file input
        const fileInput = document.getElementById('floorPlanFile');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit approval request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">
        Floor Plan Approval Request
      </h2>

      {/* Success/Error Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* --- Plot Information Section --- */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">1. Select Your Plot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="plotId" className="block text-sm font-medium text-gray-600 mb-1">
                Available Plot ID
              </label>
              <select
                id="plotId"
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#ED7600]"
              >
                {MOCK_AVAILABLE_PLOTS.map(plot => (
                  <option key={plot.id} value={plot.id}>
                    {plot.id} - ({plot.details})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Plot Details</label>
              <p className="w-full p-3 bg-gray-100 rounded-md text-gray-700">{selectedPlotDetails.details}</p>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Area</label>
              <p className="w-full p-3 bg-gray-100 rounded-md text-gray-700">{selectedPlotDetails.area}</p>
            </div>
          </div>
        </section>

        {/* --- Design & Document Submission Section --- */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">2. Provide Design Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label htmlFor="designType" className="block text-sm font-medium text-gray-600 mb-1">
                Design Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="designType"
                value={designType}
                onChange={(e) => setDesignType(e.target.value)}
                placeholder="e.g., 3-Bedroom Modern"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#ED7600]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Floor Plan Document <span className="text-red-500">*</span>
              </label>
              <label
                htmlFor="floorPlanFile"
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-[#ED7600] hover:bg-orange-50"
              >
                <FiUpload className="mr-3 text-gray-500" />
                <span className="text-gray-700">
                  {floorPlanFile ? floorPlanFile.name : 'Click to upload PDF or image'}
                </span>
              </label>
              <input
                type="file"
                id="floorPlanFile"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                required
              />
            </div>
          </div>
        </section>

        {/* --- Notes Section --- */}
        <section>
           <h3 className="text-xl font-semibold text-gray-700 mb-4">3. Add Notes for Admin (Optional)</h3>
           <div>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Requesting additional parking space..."
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#ED7600]"
              />
           </div>
        </section>

        {/* --- Submission Button --- */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className={`font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-[#ED7600] text-white hover:bg-[#d46000]'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
            <FiSend />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApprovalRequestForm;