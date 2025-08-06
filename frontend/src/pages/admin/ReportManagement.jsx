import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from "recharts";

const chartData = [
  { day: "Mon", users: 300 },
  { day: "Tue", users: 500 },
  { day: "Wed", users: 700 },
  { day: "Thu", users: 600 },
  { day: "Fri", users: 750 },
  { day: "Sat", users: 400 },
  { day: "Sun", users: 900 },
];

const societyData = [
  { name: "Residential", value: 65 },
  { name: "Commercial", value: 40 },
  { name: "Mixed Use", value: 35 },
  { name: "Gated", value: 50 },
  { name: "Township", value: 25 },
];

const reviewData = [
  { label: "Positive", count: 320 },
  { label: "Neutral", count: 100 },
  { label: "Negative", count: 80 },
];

const COLORS = ["#ed7600", "#4CAF50", "#2196F3", "#FFC107", "#9C27B0"];

const ReportManagement = () => {
  const [activeTab, setActiveTab] = useState("User Analytics");

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Reports & Analytics</h1>
      <p className="text-sm text-gray-600 mb-6">
        Access platform statistics and performance metrics.
      </p>

      <div className="flex space-x-6 mb-6 text-sm sm:text-base font-semibold">
        {["User Analytics", "Society Analytics", "Review Analytics", "Platform Activity"].map((tab) => (
          <span
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`cursor-pointer pb-1 ${
              activeTab === tab
                ? "text-orange-600 border-b-2 border-orange-600"
                : "text-gray-500"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      {activeTab === "User Analytics" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-semibold mb-4">User Growth</h2>
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28 rounded-full border-[10px] border-orange-500 flex items-center justify-center text-xl font-bold text-orange-600">
                  +24%
                
                </div>
                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p>🔵 Registered: 65%</p>
                  <p>🟢 Guests: 35%</p>
                  <p>🟠 Sub-Admins: 10%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-lg font-semibold mb-4">User Registrations Over Time</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#ed7600" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Users" value="12,483" />
            <StatCard title="New This Month" value="+842" color="text-green-600" />
            <StatCard title="Retention Rate" value="78%" />
            <StatCard title="Conversion Rate" value="3.6%" />
          </div>
        </>
      )}

      {activeTab === "Society Analytics" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Society Types Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={societyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {societyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === "Review Analytics" && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Review Sentiment Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reviewData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ed7600" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === "Platform Activity" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActivityCard icon="👤" label="Active Users" value="8,902" />
          <ActivityCard icon="🔄" label="Daily Logins" value="2,341" />
          <ActivityCard icon="💬" label="Feedback Submitted" value="184 this month" />
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color = "text-black" }) => (
  <div className="bg-white p-4 rounded-xl shadow text-center">
    <div className="text-sm text-gray-600">{title}</div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);

const ActivityCard = ({ icon, label, value }) => (
  <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center text-center">
    <div className="text-3xl">{icon}</div>
    <div className="text-sm text-gray-600 mt-2">{label}</div>
    <div className="text-xl font-bold mt-1 text-blue-600">{value}</div>
  </div>
);

export default ReportManagement;
