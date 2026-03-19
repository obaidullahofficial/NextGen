import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import advertisementAPI from '../../services/advertisementAPI';
import advertisementPlanAPI from '../../services/advertisementPlanAPI';
import paymentAPI from '../../services/paymentAPI';

const Advertisement = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [myAds, setMyAds] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    featured_image: '',
    link_url: '',
    plan_id: '',
    society_id: user?.societyId || ''
  });

  useEffect(() => {
    fetchPlans();
    fetchMyAds();
    // Update society_id when user is loaded
    if (user?.societyId) {
      console.log('Setting society_id from user:', user.societyId);
      setFormData(prev => ({
        ...prev,
        society_id: user.societyId
      }));
    }
  }, [user]);

  useEffect(() => {
    console.log('Current user:', user);
    console.log('Current formData:', formData);
  }, [user, formData]);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const result = await advertisementPlanAPI.getAllPlans(true);
      if (result.success) {
        setPlans(result.data || []);
      } else {
        setError(result.error || 'Failed to load plans');
      }
    } catch (err) {
      setError('Failed to load advertisement plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchMyAds = async () => {
    try {
      const result = await advertisementAPI.getAllAdvertisements(1, 10);
      if (result.success) {
        setMyAds(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image format
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (PNG, JPG, JPEG, GIF, or WebP)');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setError('');
      
      // Create preview and base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setImagePreview(base64);
        setFormData(prev => ({
          ...prev,
          featured_image: base64
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlanSelect = (plan) => {
    console.log('Plan selected:', plan);
    setSelectedPlan(plan);
    setFormData(prev => {
      const updated = {
        ...prev,
        plan_id: plan._id
      };
      console.log('Updated formData:', updated);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    console.log('Validating form data:', {
      title: formData.title,
      featured_image: !!formData.featured_image,
      plan_id: formData.plan_id,
      selectedPlan: selectedPlan?._id
    });
    
    if (!formData.title || !formData.featured_image || !formData.plan_id) {
      console.log('Validation failed:', {
        title_missing: !formData.title,
        image_missing: !formData.featured_image,
        plan_missing: !formData.plan_id
      });
      setError('Title, advertisement image, and plan selection are required');
      return;
    }

    // Ensure society_id is included
    const submissionData = {
      ...formData,
      society_id: user?.societyId || formData.society_id
    };

    try {
      setLoading(true);
      console.log('Creating advertisement with data:', submissionData);
      const result = await advertisementAPI.createAdvertisement(submissionData);
      console.log('Advertisement created:', result);

      if (result.success) {
        setSuccess(`${result.message} Redirecting to payment...`);
        
        // Create Stripe checkout session and redirect
        try {
          console.log('Creating checkout session...', {
            ad_id: result.advertisement_id,
            plan: selectedPlan.name,
            price: selectedPlan.price
          });

          const paymentResult = await paymentAPI.createCheckoutSession(
            result.advertisement_id,
            selectedPlan.name,
            selectedPlan.price
          );

          console.log('Payment result:', paymentResult);

          if (paymentResult.success) {
            console.log('Redirecting to Stripe:', paymentResult.checkout_url);
            // Redirect to Stripe Checkout
            window.location.href = paymentResult.checkout_url;
          } else {
            console.error('Payment session failed:', paymentResult);
            setError('Failed to create payment session: ' + (paymentResult.error || 'Unknown error'));
          }
        } catch (paymentError) {
          console.error('Payment error:', paymentError);
          setError('Payment error: ' + paymentError.message);
          // Clear form even on error to prevent duplicate submissions
          setFormData({
            title: '',
            featured_image: '',
            link_url: '',
            plan_id: ''
          });
          setImageFile(null);
          setImagePreview('');
          setSelectedPlan(null);
          fetchMyAds();
        }
      } else {
        setError(result.error || 'Failed to create advertisement');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Error creating advertisement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      case 'expired':
        return 'status-expired';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">Create Advertisement</h1>
          <p className="text-gray-600">Select a plan, upload your image, and submit for admin approval</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 text-red-800">
            <span className="text-2xl">âš </span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg flex items-center gap-3 text-green-800">
            <span className="text-2xl">âœ“</span>
            <span>{success}</span>
          </div>
        )}

        {/* Plan Selection */}
        <div className="bg-gray-50 rounded-2xl shadow-xl p-4 sm:p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Select a Plan</h2>
          {loadingPlans ? (
            <div className="text-center py-8 text-gray-600">Loading plans...</div>
          ) : plans.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No plans available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div
                  key={plan._id}
                  className={`bg-white rounded-xl p-6 cursor-pointer transition-all duration-300 border-2 ${
                    selectedPlan?._id === plan._id 
                      ? 'border-[#ED7600] shadow-lg shadow-[#ED7600]/20' 
                      : 'border-gray-300 hover:border-[#ED7600]/50'
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                    <span className="text-2xl font-bold text-[#ED7600]">Rs {plan.price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600"><strong className="text-gray-900">{plan.duration_days}</strong> days</p>
                    {selectedPlan?._id === plan._id && (
                      <span className="bg-[#ED7600] text-white px-3 py-1 rounded-full text-sm font-semibold">âœ“ Selected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advertisement Form */}
        <div className="bg-gray-50 rounded-2xl shadow-xl p-4 sm:p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 2: Advertisement Details</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-gray-700 font-semibold mb-2">
                Title <span className="text-[#ED7600]">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter advertisement title"
                required
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-[#ED7600] outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="featured_image" className="block text-gray-700 font-semibold mb-2">
                Featured Image <span className="text-[#ED7600]">*</span>
              </label>
              <input
                type="file"
                id="featured_image"
                name="featured_image"
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                onChange={handleImageChange}
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#ED7600] file:text-white file:font-semibold file:cursor-pointer hover:file:bg-[#D56900] transition-all"
                required={!imagePreview}
              />
              <small className="text-gray-400 text-sm">Upload your advertisement image (PNG, JPG, GIF, or WebP - Max 5MB)</small>
              {imagePreview && (
                <div className="mt-4 relative inline-block">
                  <img src={imagePreview} alt="Advertisement preview" className="w-full max-w-md rounded-lg border-2 border-[#ED7600]" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      setFormData(prev => ({ ...prev, featured_image: '' }));
                    }}
                  >
                    âœ• Remove
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="link_url" className="block text-gray-700 font-semibold mb-2">
                Link URL <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="url"
                id="link_url"
                name="link_url"
                value={formData.link_url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ED7600] focus:border-[#ED7600] outline-none transition-all"
              />
              <small className="text-gray-400 text-sm">Users will be directed here when they click your ad</small>
            </div>

            {!selectedPlan && (
              <p className="text-yellow-400 flex items-center gap-2 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500">
                <span>âš </span> Please select a plan first
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#ED7600] text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-[#D56900] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={loading || !selectedPlan}
            >
              {loading ? 'Creating...' : 'Create Advertisement & Pay'}
            </button>
          </form>
        </div>

        {/* My Advertisements */}
        <div className="bg-gray-50 rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Advertisements</h2>
          {myAds.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No advertisements yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Title</th>
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Plan</th>
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Price</th>
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Status</th>
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Start Date</th>
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">End Date</th>
                    <th className="text-left py-4 px-4 text-gray-700 font-semibold">Stats</th>
                  </tr>
                </thead>
                <tbody>
                  {myAds.map(ad => (
                    <tr key={ad._id} className="border-b border-gray-200 hover:bg-gray-100 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-gray-900 font-medium">{ad.title}</div>
                        {ad.link_url && <div className="text-xs text-gray-500 truncate max-w-xs">{ad.link_url}</div>}
                      </td>
                      <td className="py-4 px-4 text-gray-700">{ad.plan_name}</td>
                      <td className="py-4 px-4 text-[#ED7600] font-bold">Rs {ad.price}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ad.status === 'active' ? 'bg-green-500 text-white' :
                          ad.status === 'pending' ? 'bg-yellow-500 text-white' :
                          ad.status === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">{formatDate(ad.start_date)}</td>
                      <td className="py-4 px-4 text-gray-700">{formatDate(ad.end_date)}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-3 text-gray-600">
                          <span title="Views">ðŸ‘ {ad.impressions || 0}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Advertisement;
