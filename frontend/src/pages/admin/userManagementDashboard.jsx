import React, { useState } from "react";
import { Search, Filter, Edit2, Trash2, Lock } from "lucide-react";

const usersData = [
  {
    id: 1,
    name: "Obaidullah",
    email: "Obaidullah@example.com",
    avatar: null,
    role: "Admin",
    status: "Active",
    lastActive: "2025-05-25",
  },
  {
    id: 2,
    name: "AliyaSaqib",
    email: "sarah@example.com",
    avatar: null,
    role: "User",
    status: "Suspended",
    lastActive: "2025-05-20",
  },
  {
    id: 3,
    name: "Ashfa Noor",
    email: "mike@example.com",
    avatar: null,
    role: "Moderator",
    status: "Pending",
    lastActive: "2025-05-28",
  },
  // Add more users as needed
];

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Suspended: "bg-red-100 text-red-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

function Avatar({ name, avatar }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const colors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-red-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${color}`}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-sm font-semibold ${statusColors[status]}`}
    >
      {status}
    </span>
  );
}

function UserRow({ user }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="flex items-center space-x-4 py-3 px-4">
        <Avatar name={user.name} avatar={user.avatar} />
        <div>
          <div className="font-semibold text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      </td>
      <td className="px-4 py-3">{user.role}</td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-4 py-3">{user.lastActive}</td>
      <td className="px-4 py-3 flex space-x-4 text-gray-600">
        <button
          aria-label="Edit User"
          className="hover:text-blue-600"
          title="Edit"
        >
          <Edit2 size={18} />
        </button>
        <button
          aria-label="Delete User"
          className="hover:text-red-600"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
        <button
          aria-label="Lock User"
          className="hover:text-yellow-600"
          title="Lock"
        >
          <Lock size={18} />
        </button>
      </td>
    </tr>
  );
}

function SearchAndFilter({ search, setSearch }) {
  return (
    <div className="flex items-center space-x-3 mb-4">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      </div>
      <button
        aria-label="Filter users"
        className="p-2 border rounded-md hover:bg-gray-100"
        title="Filter"
      >
        <Filter size={20} />
      </button>
    </div>
  );
}

function Pagination({ currentPage, totalPages, setCurrentPage }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-t">
      <div className="text-gray-600 text-sm">
        Showing {(currentPage - 1) * 6 + 1} to{" "}
        {Math.min(currentPage * 6, usersData.length)} of {usersData.length} users
      </div>
      <div className="space-x-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          &lt;
        </button>
        {[1, 2, 3].map((num) => (
          <button
            key={num}
            onClick={() => setCurrentPage(num)}
            className={`px-3 py-1 border rounded ${
              currentPage === num
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-200"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function UserManagementDashboard() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = usersData.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const usersPerPage = 6;
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const displayedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="w-full min-h-screen p-6 bg-white rounded shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
    <button
  style={{ backgroundColor: "#2f3d57" }}
  className="text-white px-4 py-2 rounded hover:opacity-90"
>
  + Add User
</button>


      </div>

      <SearchAndFilter search={search} setSearch={setSearch} />

      <div className="overflow-x-auto">
        <table className="w-full text-left border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Active</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              displayedUsers.map((user) => <UserRow key={user.id} user={user} />)
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
