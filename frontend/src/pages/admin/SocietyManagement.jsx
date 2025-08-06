import { useState } from "react";
import { Search, Filter } from "lucide-react"; 

// Sample data
const societiesData = [
  {
    id: 1,
    name: "Bahria Town",
    location: "Austin, TX",
    units: 124,
    date: "15 Jan 2025",
    status: "Approved",
    image: "src/assets/Images/BTown.jpg",
  },
  {
    id: 2,
    name: "CDA",
    location: "Denver, CO",
    units: 86,
    date: "28 Mar 2025",
    status: "Pending",
    image: "src/assets/Images/cda.jpg",
  },
  {
    id: 3,
    name: "Central Plaza Commercial Complex",
    location: "Chicago, IL",
    units: 52,
    date: "02 Feb 2025",
    status: "Approved",
    image: "src/assets/Images/society.jpg",
  },
];

// Badge component for status display
const StatusBadge = ({ status }) => {
  const colors = {
    Approved: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Rejected: "bg-red-100 text-red-800",
    Blacklisted: "bg-black text-white",
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
};

export default function SocietyManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter logic
  const filteredSocieties = societiesData.filter((society) =>
    society.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    society.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold mb-1">Society Management</h1>
      <p className="text-gray-500 mb-6">
        Review and manage housing societies on the platform.
      </p>
{/* Search and Filter */}

<div className="flex items-center space-x-3 mb-6">
  <div className="relative flex-1">
    <input
      type="text"
      placeholder="Search societies..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
  </div>
  <button
    aria-label="Filter societies"
    className="p-2 border rounded-md hover:bg-gray-100"
    title="Filter"
  >
    <Filter size={20} />
  </button>
</div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSocieties.map((society) => (
          <div
            key={society.id}
            className="border rounded-xl shadow-sm overflow-hidden bg-white flex flex-col h-[420px]"
          >
            <img
              src={society.image}
              alt={society.name}
              className="w-full h-[160px] object-cover"
            />

            <div className="p-4 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h2 className="font-semibold text-lg">{society.name}</h2>
                  <StatusBadge status={society.status} />
                </div>

                <p className="text-sm text-gray-500 mb-1">📍 {society.location}</p>
                <p className="text-sm text-gray-500 mb-1">{society.units} Units</p>
                <p className="text-sm text-gray-500 mb-4">📅 {society.date}</p>
              </div>

              {/* Conditional Buttons */}
              {society.status === "Pending" ? (
                <div className="flex space-x-2">
                  <button
                    className="flex-1 text-white py-2 rounded-md text-sm hover:opacity-90"
                    style={{ backgroundColor: "#2f3d57" }}
                  >
                    Approve
                  </button>
                  <button
                    className="flex-1 text-white py-2 rounded-md text-sm hover:opacity-90"
                    style={{ backgroundColor: "#2f3d57" }}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <button
                  className="w-full text-white py-2 rounded-md text-sm hover:opacity-90"
                  style={{ backgroundColor: "#2f3d57" }}
                >
                  View Details
                </button>
              )}
            </div>
          </div>
        ))}

        {/* No results message */}
        {filteredSocieties.length === 0 && (
          <p className="text-gray-500 col-span-full text-center mt-10">
            No societies match your search.
          </p>
        )}
      </div>
    </div>
  );
}
