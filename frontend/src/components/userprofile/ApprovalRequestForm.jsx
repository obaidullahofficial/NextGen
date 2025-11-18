import React, { useState, useEffect } from 'react';
import { FiUpload, FiFileText, FiSend } from 'react-icons/fi';
import { userProfileAPI, createApprovalRequestFormData } from '../../services/userProfileAPI';


const ApprovalRequestForm = () => {
  // Society & plot selection
  const [societies, setSocieties] = useState([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [availablePlots, setAvailablePlots] = useState([]);

  // State to manage all form inputs
  const [selectedPlotId, setSelectedPlotId] = useState('');
  const [designType, setDesignType] = useState('');
  const [floorPlanFile, setFloorPlanFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // State for the derived plot details, to display them in the UI
  const [selectedPlotDetails, setSelectedPlotDetails] = useState(null);

  // Helper to reset form state back to initial (after societies have loaded)
  const resetFormState = () => {
    setDesignType('');
    setFloorPlanFile(null);
    setNotes('');

    // Reset selections to the first society (if any) and clear plot selection;
    // plot list will be reloaded by the useEffect on selectedSocietyId.
    if (societies.length > 0) {
      setSelectedSocietyId(societies[0]._id);
    } else {
      setSelectedSocietyId('');
      setAvailablePlots([]);
    }
    setSelectedPlotId('');
    setSelectedPlotDetails(null);

    const fileInput = document.getElementById('floorPlanFile');
    if (fileInput) fileInput.value = '';
  };

  // Load all registered societies when form mounts
  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const response = await userProfileAPI.getSocieties();
        const list = response.data || [];

        setSocieties(list);
        if (list.length > 0) {
          setSelectedSocietyId(list[0]._id);
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load societies' });
      }
    };

    fetchSocieties();
  }, []);

  // Load plots whenever selected society changes
  useEffect(() => {
    const fetchPlots = async () => {
      if (!selectedSocietyId) {
        setAvailablePlots([]);
        setSelectedPlotId('');
        setSelectedPlotDetails(null);
        return;
      }

      try {
        const plotsResponse = await userProfileAPI.getPlotsBySociety(selectedSocietyId);
        const plots = plotsResponse || [];

        const mappedPlots = plots.map((plot) => ({
          id: plot._id || plot.plot_id || plot.plot_number,
          label: plot.plot_number || plot._id,
          details: `${plot.plot_number || 'Plot'}${plot.type ? ` - ${plot.type}` : ''}${plot.location ? `, ${plot.location}` : ''}`,
          area: plot.area || '',
          raw: plot,
        }));

        setAvailablePlots(mappedPlots);

        if (mappedPlots.length > 0) {
          setSelectedPlotId(mappedPlots[0].id);
          setSelectedPlotDetails(mappedPlots[0]);
        } else {
          setSelectedPlotId('');
          setSelectedPlotDetails(null);
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load plots for selected society' });
      }
    };

    fetchPlots();
  }, [selectedSocietyId]);

  // This effect updates the displayed plot details whenever the user selects a new plot
  useEffect(() => {
    if (!selectedPlotId) {
      setSelectedPlotDetails(null);
      return;
    }

    const plot = availablePlots.find((p) => p.id === selectedPlotId);
    if (plot) {
      setSelectedPlotDetails(plot);
    }
  }, [selectedPlotId, availablePlots]);

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
    if (!selectedSocietyId || !selectedPlotId || !designType || !floorPlanFile) {
      setMessage({ type: 'error', text: 'Please select a society & plot, fill out all required fields, and upload a floor plan.' });
      setLoading(false);
      return;
    }

    try {
      // --- Prepare the data for submission ---
      const selectedSociety = societies.find((s) => s._id === selectedSocietyId);

      const requestData = {
        societyId: selectedSocietyId,
        societyName: selectedSociety ? selectedSociety.name : '',
        plotId: selectedPlotId,
        // Human-readable plot number (label) for convenience in admin views
        plotNumber: selectedPlotDetails ? selectedPlotDetails.label : '',
        // Area comes directly from the selected plot record in the database
        area: selectedPlotDetails ? selectedPlotDetails.area : '',
        designType,
        notes,
      };

      const formData = createApprovalRequestFormData(requestData, floorPlanFile);
      
      const response = await userProfileAPI.createApprovalRequest(formData);
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message });
        // Reset form but keep success message; modal will show it
        resetFormState();
        setShowSuccessModal(true);
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

      {/* Error Message (success is shown via modal) */}
      {message.text && message.type === 'error' && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 border border-red-400 text-red-700">
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* --- Plot Information Section --- */}
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">1. Select Your Plot</h3>

          {/* Society selection */}
          <div className="mb-4">
            <label
              htmlFor="societyId"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Society
            </label>
            <select
              id="societyId"
              value={selectedSocietyId}
              onChange={(e) => setSelectedSocietyId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#ED7600]"
            >
              {societies.length === 0 && (
                <option value="" disabled>
                  No societies available
                </option>
              )}
              {societies.map((society) => (
                <option key={society._id} value={society._id}>
                  {society.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="plotId" className="block text-sm font-medium text-gray-600 mb-1">
                Available Plot
              </label>
              <select
                id="plotId"
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#ED7600]"
                disabled={availablePlots.length === 0}
              >
                {availablePlots.length === 0 && (
                  <option value="" disabled>
                    {selectedSocietyId ? 'No record found' : 'Select a society first'}
                  </option>
                )}
                {availablePlots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.label} - ({plot.area})
                  </option>
                ))}
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Area</label>
              <p className="w-full p-3 bg-gray-100 rounded-md text-gray-700">
                {selectedPlotDetails ? selectedPlotDetails.area : '-'}
              </p>
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
                accept=".json,application/json"
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Request Submitted</h3>
            <p className="text-gray-600 mb-6">
              {message.text || 'Your floor plan approval request has been submitted successfully.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                setMessage({ type: '', text: '' });
                resetFormState();
              }}
              className="bg-[#ED7600] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#d46000] transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalRequestForm;