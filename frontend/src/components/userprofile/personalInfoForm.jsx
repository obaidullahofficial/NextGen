import React, { useState, useEffect } from 'react';
import { userProfileAPI, createProfileFormData } from '../../services/userProfileAPI';

const PersonalInfoForm = () => {
  const [form, setForm] = useState({
    cnic: '',
    cnicFront: null,
    cnicBack: null,
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    profileImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingProfile, setExistingProfile] = useState(null);

  // Load existing profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userProfileAPI.getProfile();
      if (response.success && response.data) {
        const profileData = response.data;
        setExistingProfile(profileData);
        setForm(prev => ({
          ...prev,
          cnic: profileData.cnic || '',
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          // File URLs are displayed separately, not in form state
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Create FormData for API request
      const profileData = {
        firstName: form.firstName,
        lastName: form.lastName,
        cnic: form.cnic,
        phone: form.phone,
        email: form.email,
      };

      const files = {
        profileImage: form.profileImage,
        cnicFront: form.cnicFront,
        cnicBack: form.cnicBack,
      };

      const formData = createProfileFormData(profileData, files);
      
      const response = await userProfileAPI.updateProfile(formData);
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message });
        // Reload profile to show updated data
        await loadProfile();
        // Clear file inputs
        setForm(prev => ({
          ...prev,
          profileImage: null,
          cnicFront: null,
          cnicBack: null,
        }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      <form
        className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-10 space-y-8 border border-gray-100"
        onSubmit={handleSubmit}
      >
        <h2 className="text-3xl font-extrabold text-[#2F3D57] border-b pb-4">
          Personal Information
        </h2>

        {/* Current Profile Status */}
        {existingProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Current Profile Status</h3>
            <div className="text-sm text-blue-700">
              <p>Profile Image: {existingProfile.profile_image_url ? '✓ Uploaded' : '✗ Not uploaded'}</p>
              <p>CNIC Documents: {existingProfile.cnic_front_url ? '✓ Uploaded' : '✗ Not uploaded'}</p>
              <p>Verification Status: {existingProfile.is_verified ? '✓ Verified' : '⏳ Pending'}</p>
            </div>
          </div>
        )}

      {/* Name fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-1 text-gray-700">First Name</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ED7600]"
            placeholder="Aliya"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-700">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ED7600]"
            placeholder="Ch"
            required
          />
        </div>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-1 text-gray-700">Phone Number</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ED7600]"
            placeholder="+92 300 1234567"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-700">Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ED7600]"
            placeholder="example@email.com"
            required
          />
        </div>
      </div>

      {/* CNIC */}
  <div>
  <label className="block font-medium mb-1 text-gray-700">CNIC Number</label>
  <input
    type="text"
    name="cnic"
    value={form.cnic}
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, ''); // remove non-digits
      if (value.length <= 13) {
        setForm((prev) => ({ ...prev, cnic: value }));
      }
    }}
    maxLength={13}
    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ED7600]"
    placeholder="13-digit CNIC without dashes"
    required
  />
  <p className="text-sm text-gray-500 mt-1">Enter 13 digits without dashes</p>
</div>
      {/* Profile Image */}
      <div>
  <label className="block font-semibold mb-2 text-gray-700">Profile Photo</label>
  <div className="flex items-center gap-4">
    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
      {form.profileImage ? (
        <img
          src={URL.createObjectURL(form.profileImage)}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <svg
          className="w-12 h-12 text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            fillRule="evenodd"
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 
               1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 
               4v2h16v-2c0-2.66-5.33-4-8-4z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
    <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded border border-gray-300 hover:bg-gray-200">
      Upload photo
      <input
        type="file"
        name="profileImage"
        accept="image/*"
        className="hidden"
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            profileImage: e.target.files[0],
          }))
        }
        required
      />
    </label>
  </div>
</div>


      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`px-8 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#ED7600] hover:bg-[#D56900] text-white'
          }`}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </form>
    </>
  );
};

export default PersonalInfoForm;
