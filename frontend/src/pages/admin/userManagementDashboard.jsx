import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import debounce from "lodash.debounce";
import { 
  Edit2, 
  Trash2, 
  Lock, 
  UserPlus, 
  Search, 
  Filter,
  MoreVertical,
  Users,
  Crown,
  Shield,
  User as UserIcon,
  Eye,
  RefreshCw,
  X,
  Save,
  AlertCircle,
  CheckSquare,
  Square,
  Trash,
  UserCheck,
  UserX,
  Settings
} from "lucide-react";

//
// 🔹 Add User Modal Component
//
function AddUserModal({ isOpen, onClose, onUserAdded }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'user'
        });
        onUserAdded(); // Refresh the user list
        onClose(); // Close modal
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
              <p className="text-xs text-gray-500">Create a new user account</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-xs text-red-700">{error}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="user">User</option>
              <option value="society">Society</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm password"
              required
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

//
// 🔹 View User Modal Component
//
function ViewUserModal({ isOpen, onClose, user }) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">User Details</h2>
              <p className="text-xs text-gray-500">View user information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center mb-4">
            <Avatar name={user.username} avatar={null} role={user.role} />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500">Username</label>
              <p className="text-base font-semibold text-gray-900">{user.username}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500">Role</label>
              <RoleBadge role={user.role} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500">User ID</label>
              <p className="text-xs text-gray-600 font-mono">{user._id}</p>
            </div>

            {user.society_id && (
              <div>
                <label className="block text-xs font-medium text-gray-500">Society ID</label>
                <p className="text-xs text-gray-600 font-mono">{user.society_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

//
// 🔹 Edit User Modal Component
//
function EditUserModal({ isOpen, onClose, user, onUserUpdated }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'user',
        password: ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        updateData.password = formData.password;
      }

      const response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        onUserUpdated();
        onClose();
      } else {
        setError(data.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      role: 'user',
      password: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Edit2 size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
              <p className="text-xs text-gray-500">Update user information</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-xs text-red-700">{error}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="user">User</option>
              <option value="society">Society</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Password (Optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              New Password (Optional)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Leave blank to keep current password"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

//
// 🔹 Delete Confirmation Modal
//
function DeleteConfirmModal({ isOpen, onClose, user, onUserDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });

      const data = await response.json();

      if (data.success) {
        onUserDeleted();
        onClose();
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Delete User</h2>
              <p className="text-xs text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-xs text-red-700">{error}</span>
            </div>
          )}

          <p className="text-gray-700 mb-4">
            Are you sure you want to delete user <strong>{user.username}</strong>?
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800">
              ⚠️ This will permanently remove the user and all associated data.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Delete User</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

//
// 🔹 Avatar Component
//
function Avatar({ name, avatar, role }) {
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white';
      case 'society':
        return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-500 text-white';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Crown size={12} className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 p-0.5 rounded-full" />;
      case 'society':
        return <Shield size={12} className="absolute -top-1 -right-1 bg-blue-400 text-blue-900 p-0.5 rounded-full" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <div className={`relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-md ${getRoleColor(role)}`}>
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold">
            {name ? name.charAt(0).toUpperCase() : "?"}
          </span>
        )}
      </div>
      {getRoleIcon(role)}
    </div>
  );
}

//
// 🔹 Status Badge Component
//
function StatusBadge({ status }) {
  const colors = {
    Active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    Inactive: "bg-red-100 text-red-700 border border-red-200",
    Pending: "bg-amber-100 text-amber-700 border border-amber-200",
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${
        colors[status] || "bg-gray-100 text-gray-700 border border-gray-200"
      }`}
    >
      • {status}
    </span>
  );
}

//
// 🔹 Role Badge Component
//
function RoleBadge({ role }) {
  const colors = {
    admin: "bg-purple-100 text-purple-700 border border-purple-200",
    society: "bg-blue-100 text-blue-700 border border-blue-200",
    user: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  const icons = {
    admin: <Crown size={12} />,
    society: <Shield size={12} />,
    user: <UserIcon size={12} />,
  };

  return (
    <span
      className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-full ${
        colors[role?.toLowerCase()] || colors.user
      }`}
    >
      {icons[role?.toLowerCase()] || icons.user}
      <span className="capitalize">{role || "User"}</span>
    </span>
  );
}

//
// 🔹 User Row Component
//
function UserRow({ user, index, selectedUsers, onSelectUser, onViewUser, onEditUser, onDeleteUser }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isSelected = selectedUsers.includes(user._id);

  return (
    <tr className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
      {/* Checkbox */}
      <td className="py-4 px-6">
        <button
          onClick={() => onSelectUser(user._id)}
          className="flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>
      </td>

      {/* User Info */}
      <td className="py-4 px-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={user.username} avatar={null} role={user.role} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{user.username}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
            <div className="text-xs text-gray-400">ID: {user._id?.slice(-8) || 'N/A'}</div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-6 py-4">
        <RoleBadge role={user.role} />
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge status={"Active"} />
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              <button 
                onClick={() => {
                  onViewUser(user);
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye size={16} />
                <span>View Details</span>
              </button>
              <button 
                onClick={() => {
                  onEditUser(user);
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={16} />
                <span>Edit User</span>
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                onClick={() => {
                  onDeleteUser(user);
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete User</span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

//
// 🔹 Stats Card Component
//
function StatsCard({ icon: Icon, title, value, change, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

//
// 🔹 Dashboard Component
//
export default function UserManagementDashboard() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input for backend querying
  const debouncedSearchUpdate = useMemo(
    () => debounce((val) => setDebouncedSearch(val), 500),
    []
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    debouncedSearchUpdate(e.target.value);
    setCurrentPage(1); // reset to first page on search
  };

  const { data: usersData, error, isLoading: loading, mutate: refreshUsers } = useSWR(
    `http://localhost:5000/api/users?page=1&limit=1000&search=${debouncedSearch}&role=${filterRole}`,
    async (url) => {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      const json = await res.json();
      return json.success ? json.users : [];
    },
    { revalidateOnFocus: false }
  );

  const users = usersData || [];
  const refreshing = false;

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // ✅ Refresh wrapped for callbacks
  const fetchUsers = () => refreshUsers();

  // 🔹 CRUD Handlers
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // 🔹 Bulk Selection Handlers
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(displayedUsers.map(user => user._id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      try {
        const response = await fetch('http://localhost:5000/api/users/bulk-delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({ user_ids: selectedUsers })
        });

        const data = await response.json();

        if (data.success) {
          fetchUsers(); // Refresh the user list
          setSelectedUsers([]);
          setSelectAll(false);
        } else {
          alert('Failed to delete users: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting users:', error);
        alert('Failed to delete users. Please try again.');
      }
    }
  };

  // 🔹 Modal Callbacks
  const handleUserAdded = () => {
    fetchUsers(); // Refresh the user list
    setIsAddUserModalOpen(false);
  };

  const handleUserUpdated = () => {
    fetchUsers(); // Refresh the user list
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserDeleted = () => {
    fetchUsers(); // Refresh the user list
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  // 🔹 Search + Filter + Pagination
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const usersPerPage = 8;
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const displayedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // 🔹 Calculate stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const societyCount = users.filter(u => u.role === 'society').length;
  const regularCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="min-min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* 🔹 Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1 text-xs">Manage and monitor all system users</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchUsers}
                disabled={refreshing}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-xs"
              >
                <UserPlus size={14} />
                <span>Add User</span>
              </button>
              {selectedUsers.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm text-xs"
                >
                  <Trash2 size={14} />
                  <span>Delete ({selectedUsers.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* 🔹 Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              icon={Users}
              title="Total Users"
              value={totalUsers}
              change={12}
              color="blue"
            />
            <StatsCard
              icon={Crown}
              title="Administrators"
              value={adminCount}
              color="purple"
            />
            <StatsCard
              icon={Shield}
              title="Societies"
              value={societyCount}
              change={8}
              color="green"
            />
            <StatsCard
              icon={UserIcon}
              title="Regular Users"
              value={regularCount}
              change={15}
              color="orange"
            />
          </div>
        </div>

        {/* 🔹 Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {/* 🔹 Filters */}
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full sm:w-64 md:w-full md:w-80 max-w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  />
                </div>
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="society">Society</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {filteredUsers.length} of {totalUsers} users
              </div>
            </div>
          </div>

          {/* 🔹 Table */}
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[900px] max-w-none text-left ">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw size={20} className="animate-spin text-blue-500" />
                        <span className="text-gray-500">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-2">
                        <Users size={48} className="text-gray-300" />
                        <span className="text-gray-500">No users found.</span>
                        <span className="text-xs text-gray-400">Try adjusting your search or filters.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((user, index) => (
                    <UserRow 
                      key={user._id} 
                      user={user} 
                      index={index}
                      selectedUsers={selectedUsers}
                      onSelectUser={handleSelectUser}
                      onViewUser={handleViewUser}
                      onEditUser={handleEditUser}
                      onDeleteUser={handleDeleteUser}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 🔹 Pagination */}
          {filteredUsers.length > 0 && (
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Showing <span className="font-semibold">{(currentPage - 1) * usersPerPage + 1}</span> to{" "}
                  <span className="font-semibold">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> of{" "}
                  <span className="font-semibold">{filteredUsers.length}</span> users
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                      currentPage === totalPages || totalPages === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Modals */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user={selectedUser}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={selectedUser}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
}
