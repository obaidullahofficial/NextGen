import React, { useState } from "react";
import { Edit2, Trash2, Check, X, Plus } from "lucide-react";

const initialAds = [
  {
    id: 1,
    title: "Featured Plot in Bahria Town",
    type: "Banner",
    status: "Pending",
    duration: "1 Month",
    package: "Featured",
    clicks: 120,
    views: 1500,
    location: "Homepage",
    submittedBy: "Subadmin1",
  },
  {
    id: 2,
    title: "Society Launch Promo",
    type: "Text",
    status: "Approved",
    duration: "1 Week",
    package: "Weekly",
    clicks: 45,
    views: 600,
    location: "Sidebar",
    submittedBy: "Subadmin2",
  },
];

const statusColors = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-sm font-semibold ${statusColors[status] || "bg-gray-100 text-gray-700"}`}
      style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
    >
      {status}
    </span>
  );
}

export default function AdvertisementManagement() {
  const [ads, setAds] = useState(initialAds);
  const [tab, setTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "Banner",
    duration: "1 Week",
    package: "Weekly",
    location: "Homepage",
  });

  // Filter ads by tab
  const filteredAds =
    tab === "pending"
      ? ads.filter((ad) => ad.status === "Pending")
      : ads;

  // Handlers
  const handleApprove = (id) =>
    setAds((ads) =>
      ads.map((ad) =>
        ad.id === id ? { ...ad, status: "Approved" } : ad
      )
    );
  const handleReject = (id) =>
    setAds((ads) =>
      ads.map((ad) =>
        ad.id === id ? { ...ad, status: "Rejected" } : ad
      )
    );
  const handleDelete = (id) =>
    setAds((ads) => ads.filter((ad) => ad.id !== id));
  const handleEdit = (ad) => {
    setForm(ad);
    setShowForm(true);
  };
  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (form.id) {
      setAds((ads) =>
        ads.map((ad) => (ad.id === form.id ? { ...form, status: "Pending" } : ad))
      );
    } else {
      setAds((ads) => [
        ...ads,
        {
          ...form,
          id: Date.now(),
          status: "Pending",
          clicks: 0,
          views: 0,
          submittedBy: "Admin",
        },
      ]);
    }
    setShowForm(false);
    setForm({
      title: "",
      type: "Banner",
      duration: "1 Week",
      package: "Weekly",
      location: "Homepage",
    });
  };

  return (
    <div
      className="p-6"
      style={{
        fontFamily: "Segoe UI, sans-serif",
        color: "#333",
        fontSize: "16px",
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Advertisement Management</h1>
          <p style={{ color: "#666" }}>
            Manage, review, and create advertisements for the platform.
          </p>
        </div>
        <button
          className="flex items-center text-white px-4 py-2 rounded hover:opacity-90"
          style={{ backgroundColor: "#2f3d57", fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
          onClick={() => { setShowForm(true); setForm({ title: "", type: "Banner", duration: "1 Week", package: "Weekly", location: "Homepage" }); }}
        >
          <Plus size={18} className="mr-2" /> Create Ad
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          className={`py-2 px-4 rounded ${tab === "all" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
          style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
          onClick={() => setTab("all")}
        >
          All Ads
        </button>
        <button
          className={`py-2 px-4 rounded ${tab === "pending" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
          style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
          onClick={() => setTab("pending")}
        >
          Pending Review
        </button>
        <button
          className={`py-2 px-4 rounded ${tab === "create" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
          style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
          onClick={() => setShowForm(true)}
        >
          Create Ad
        </button>
      </div>

      {/* Ad Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Title</th>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Type</th>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Duration</th>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Package</th>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Location</th>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Clicks</th>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Views</th>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Status</th>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Submitted By</th>
              <th className="py-3 px-4" style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAds.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-6 text-gray-500" style={{ color: "#777" }}>
                  No advertisements found.
                </td>
              </tr>
            ) : (
              filteredAds.map((ad) => (
                <tr key={ad.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{ad.title}</td>
                  <td className="py-3 px-4">{ad.type}</td>
                  <td className="py-3 px-4">{ad.duration}</td>
                  <td className="py-3 px-4">{ad.package}</td>
                  <td className="py-3 px-4">{ad.location}</td>
                  <td className="py-3 px-4">{ad.clicks}</td>
                  <td className="py-3 px-4">{ad.views}</td>
                  <td className="py-3 px-4"><StatusBadge status={ad.status} /></td>
                  <td className="py-3 px-4">{ad.submittedBy}</td>
                  <td className="py-3 px-4 flex space-x-2">
                    {ad.status === "Pending" && (
                      <>
                        <button
                          className="text-green-600 hover:underline"
                          title="Approve"
                          onClick={() => handleApprove(ad.id)}
                        >
                          <Check size={18} />
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          title="Reject"
                          onClick={() => handleReject(ad.id)}
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                    <button
                      className="text-blue-600 hover:underline"
                      title="Edit"
                      onClick={() => handleEdit(ad)}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      title="Delete"
                      onClick={() => handleDelete(ad.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ad Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg" style={{ fontFamily: "Segoe UI, sans-serif" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: 16 }}>
              {form.id ? "Edit Advertisement" : "Create Advertisement"}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-3">
                <label className="block mb-1">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded px-3 py-2"
                  style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                  style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
                >
                  <option>Banner</option>
                  <option>Text</option>
                  <option>Featured Plot</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Duration</label>
                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                  style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
                >
                  <option>1 Week</option>
                  <option>1 Month</option>
                  <option>3 Months</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Package</label>
                <select
                  name="package"
                  value={form.package}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                  style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
                >
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Featured</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Location</label>
                <select
                  name="location"
                  value={form.location}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                  style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
                >
                  <option>Homepage</option>
                  <option>Sidebar</option>
                  <option>Dashboard Banner</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={() => setShowForm(false)}
                  style={{ fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-white"
                  style={{ backgroundColor: "#2f3d57", fontFamily: "Segoe UI, sans-serif", fontSize: "16px" }}
                >
                  {form.id ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}