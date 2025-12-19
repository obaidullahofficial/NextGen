import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userProfileAPI, createProfileFormData } from '../../services/userProfileAPI';
import { useAuth } from '../../context/AuthContext';

const PersonalInfoForm = () => {
  const navigate = useNavigate();
  const { updateUserProfile, user } = useAuth();
  const [form, setForm] = useState({
    cnic: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: user?.email || '',
    profileImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [existingProfile, setExistingProfile] = useState(null);

  // Load existing profile data
  useEffect(() => {
    loadProfile();
  }, []);
  
  // Set email from user context when available
  useEffect(() => {
    if (user?.email) {
      setForm(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [user]);

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
      };

      const formData = createProfileFormData(profileData, files);
      
      const response = await userProfileAPI.updateProfile(formData);
      
      if (response.success) {
        console.log('[PROFILE UPDATE] Full response:', response);
        console.log('[PROFILE UPDATE] Response data:', response.data);
        console.log('[PROFILE UPDATE] All fields:', Object.keys(response.data));
        setMessage({ type: 'success', text: response.message });
        // Update AuthContext with new profile data
        if (response.data) {
          console.log('[PROFILE UPDATE] Updating context with:', {
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            profileImage: response.data.profile_image_url || response.data.profile_image,
            allData: response.data
          });
          updateUserProfile(response.data);
        }
        // Show success message briefly then redirect to home
        setTimeout(() => {
          navigate('/');
        }, 1500);
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
              <p>Verification Status: {existingProfile.is_verified ? '✓ Verified' : '✓ Pending'}</p>
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
            placeholder="Name"
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
            type="tel"
            name="phone"
            value={form.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
              // Only allow 11 digits and must start with 0
              if (value.length <= 11 && (value === '' || value.startsWith('0'))) {
                setForm((prev) => ({ ...prev, phone: value }));
              }
            }}
            maxLength={11}
            pattern="^03[0-9]{9}$"
            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ED7600]"
            placeholder="03001234567"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Enter 11 digits starting with 03 (e.g., 03001234567)</p>
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-700">Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            readOnly
            disabled
            className="border border-gray-300 rounded-lg px-4 py-2 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
            title="Email cannot be changed. This is your login email."
          />
          <p className="text-xs text-gray-500 mt-1">This is your login email and cannot be changed</p>
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
      ) : existingProfile?.profile_image_url ? (
        <img
          src={`http://localhost:5000/api/file/${existingProfile.profile_image_url.replace(/^\//, '')}`}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      {!form.profileImage && !existingProfile?.profile_image_url && (
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
      {existingProfile?.profile_image_url ? 'Change photo' : 'Upload photo'}
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
