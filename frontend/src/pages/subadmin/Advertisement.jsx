import React, { useState, useEffect } from "react";
import advertisementAPI from "../../services/advertisementAPI";
import { getSocietyProfile } from "../../services/apiService";

const plotSizeOptions = ["5 Marla", "10 Marla", "1 Kanal", "2 Kanal", "5 Kanal", "1 Acre"];
const possessionOptions = ["ready", "under_construction", "planning"];

const Advertisement = () => {
  const [societyName, setSocietyName] = useState("");

  const [formData, setFormData] = useState({
    location: "",
    plot_sizes: [],
    price_start: "",
    price_end: "",
    contact_number: "",
    description: "",
    facilities: "",
    installments_available: false,
    possession_status: "ready",
  });

  const [loading, setLoading] = useState(false);
  const [societyLoading, setSocietyLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const loadSociety = async () => {
      try {
        const result = await getSocietyProfile();
        const profile = result?.profile || result?.data || result;
        const name = profile?.name || "";
        setSocietyName(name);
      } catch (e) {
        console.error("Failed to load society profile for advertisement:", e);
        setError(e.message || "Failed to load society information. Please ensure your society profile is set up.");
      } finally {
        setSocietyLoading(false);
      }
    };

    loadSociety();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePlotSizeToggle = (size) => {
    setFormData((prev) => ({
      ...prev,
      plot_sizes: prev.plot_sizes.includes(size)
        ? prev.plot_sizes.filter((s) => s !== size)
        : [...prev.plot_sizes, size],
    }));
  };

  const resetForm = () => {
    setFormData({
      location: "",
      plot_sizes: [],
      price_start: "",
      price_end: "",
      contact_number: "",
      description: "",
      facilities: "",
      installments_available: false,
      possession_status: "ready",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setShowConfirmDialog(false);

    try {
      const payload = {
        ...formData,
        society_name: societyName,
        price_start: parseFloat(formData.price_start),
        price_end: formData.price_end ? parseFloat(formData.price_end) : undefined,
        status: "pending", // so admin can review and approve
      };

      const result = await advertisementAPI.createAdvertisement(payload);

      if (result.success) {
        setSuccess("Advertisement request submitted successfully. Admin can now review it.");
        resetForm();
      } else {
        setError(result.error || "Failed to submit advertisement request.");
      }
    } catch (err) {
      console.error("Error creating advertisement:", err);
      setError(err.message || "Failed to submit advertisement request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4f6] via-white to-[#e5e7eb] py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-[#2F3D57] tracking-tight flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F3D57] text-white text-xl font-semibold shadow-md">
              Ad
            </span>
            <span>Create Advertisement</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-3xl">
            Fill in the details below to request an advertisement for your society. The admin will be able
            to review, approve and feature your advertisement on the platform.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50/80 text-red-700 border border-red-200 text-sm shadow-sm flex items-start gap-2">
            <span className="mt-0.5 h-2 w-2 rounded-full bg-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-50/80 text-green-700 border border-green-200 text-sm shadow-sm flex items-start gap-2">
            <span className="mt-0.5 h-2 w-2 rounded-full bg-green-500" />
            <span>{success}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-6"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              placeholder="City / Area"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Plot Sizes <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3 mt-1">
            {plotSizeOptions.map((size) => (
              <label key={size} className="inline-flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.plot_sizes.includes(size)}
                  onChange={() => handlePlotSizeToggle(size)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Starting Price (PKR) <span className="text-red-500">*</span>
              </label>
            <input
              type="number"
              name="price_start"
              value={formData.price_start}
              onChange={handleChange}
              required
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              placeholder="e.g. 5000000"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ending Price (PKR)</label>
            <input
              type="number"
              name="price_end"
              value={formData.price_end}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            placeholder="e.g. +92 300 1234567"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            placeholder="Short description of the advertised plots / society"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Facilities</label>
          <textarea
            name="facilities"
            value={formData.facilities}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            placeholder="e.g. Gated community, electricity, gas, water, parks, schools, 24/7 security"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Possession Status</label>
            <select
              name="possession_status"
              value={formData.possession_status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              {possessionOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 flex items-center">
            <label className="inline-flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="installments_available"
                checked={formData.installments_available}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
              />
              Installments available
            </label>
          </div>
        </div>


        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#2F3D57] hover:bg-[#1E2A3B] disabled:opacity-50 transition-colors"
          >
            {loading ? "Submitting..." : "Submit Advertisement Request"}
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200">
              <svg className="w-8 h-8 text-[#2F3D57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Submit Advertisement Request?
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to submit this advertisement request? The admin will review and approve it before it becomes visible.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors bg-[#2F3D57] hover:bg-[#1E2A3B]"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default Advertisement;
