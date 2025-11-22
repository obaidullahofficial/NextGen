import React from "react";

const UserDesignStatus = () => {
  // Dummy data - replace with API data later
  const myRequests = [
    {
      id: "REQ-001",
      plotDetails: "Residential Plot Y, 10 Marla",
      designType: "4-Bedroom Modern",
      requestDate: "2023-08-12",
      status: "Approved",
    },
    {
      id: "REQ-002",
      plotDetails: "Residential Plot B, 5 Marla",
      designType: "3-Bedroom Contemporary",
      requestDate: "2023-08-18",
      status: "Pending",
    },
    {
      id: "REQ-003",
      plotDetails: "Residential Plot, 1 Kanal",
      designType: "Corner House",
      requestDate: "2023-08-20",
      status: "Rejected",
    },
  ];

  const statusColors = {
    Approved: "bg-green-100 text-green-700 border border-green-300",
    Pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    Rejected: "bg-red-100 text-red-700 border border-red-300",
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-extrabold mb-8 text-gray-800 tracking-tight">
           My Design Requests
        </h2>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-[#ED7600] text-white px-5 py-2 rounded-lg hover:bg-[#d46000] transition-colors text-sm font-semibold shadow-sm hover:shadow-md text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Request ID</th>
                <th className="px-6 py-4 text-left font-semibold">Plot Details</th>
                <th className="px-6 py-4 text-left font-semibold">Design Type</th>
                <th className="px-6 py-4 text-left font-semibold">Request Date</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((req, index) => (
                <tr
                  key={req.id}
                  className={`transition-all duration-200 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-indigo-50`}
                >
                  <td className="px-6 py-4 font-medium">{req.id}</td>
                  <td className="px-6 py-4">{req.plotDetails}</td>
                  <td className="px-6 py-4">{req.designType}</td>
                  <td className="px-6 py-4">{req.requestDate}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusColors[req.status]}`}
                    >
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDesignStatus;
