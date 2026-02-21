import React, { useState, useEffect } from 'react';
import subscriptionAPI from '../../services/subscriptionAPI';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPlansAndSubscription();
  }, []);

  const fetchPlansAndSubscription = async () => {
    setLoading(true);
    try {
      // Fetch active plans
      const plansResult = await subscriptionAPI.getAllPlans('active');
      if (plansResult.success) {
        setPlans(plansResult.data);
      }

      // Fetch current subscription
      const subResult = await subscriptionAPI.getMySubscription();
      if (subResult.success && subResult.data) {
        setCurrentSubscription(subResult.data);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (currentSubscription) {
      setError('You already have an active subscription. Please cancel it first.');
      return;
    }

    setSubscribing(true);
    setError('');
    setSuccess('');

    try {
      const result = await subscriptionAPI.subscribeToPlan(planId);
      
      if (result.success) {
        setSuccess(result.message || 'Successfully subscribed!');
        // Refresh data
        await fetchPlansAndSubscription();
      } else {
        setError(result.error || 'Failed to subscribe');
      }
    } catch (err) {
      setError('An error occurred while subscribing');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const result = await subscriptionAPI.cancelSubscription(currentSubscription._id);
      
      if (result.success) {
        setSuccess('Subscription cancelled successfully');
        setCurrentSubscription(null);
        await fetchPlansAndSubscription();
      } else {
        setError(result.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('An error occurred while cancelling');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading subscription plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Subscription Plans</h1>
          <p className="text-gray-600">Choose a plan to start advertising your properties</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-center justify-between text-red-800">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-2xl hover:text-red-600">×</button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg flex items-center justify-between text-green-800">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-2xl hover:text-green-300">×</button>
          </div>
        )}

        {/* Current Subscription */}
        {currentSubscription && (
          <div className="bg-gray-50 rounded-2xl shadow-xl p-8 mb-8 border border-[#ED7600]">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Current Subscription</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Plan:</span>
                <span className="text-gray-900 font-semibold">{currentSubscription.plan_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Price:</span>
                <span className="text-[#ED7600] font-bold">PKR {currentSubscription.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ad Limit:</span>
                <span className="text-gray-900 font-semibold">
                  {currentSubscription.ads_used} / {currentSubscription.ad_limit} ads used
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subscribed:</span>
                <span className="text-gray-900">{formatDate(currentSubscription.subscribed_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Expires:</span>
                <span className="text-gray-900">{formatDate(currentSubscription.expiry_date)}</span>
              </div>
                <span className="text-gray-400">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  currentSubscription.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {currentSubscription.status}
                </span>
              </div>
            </div>
            {currentSubscription.status === 'active' && (
              <button 
                onClick={handleCancelSubscription}
                className="mt-6 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        )}

        {/* Available Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan._id} 
              className={`bg-gray-50 rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 ${
                currentSubscription?.plan_id === plan._id 
                  ? 'border-[#ED7600] shadow-[#ED7600]/20' 
                  : 'border-gray-300 hover:border-[#ED7600]/50'
              }`}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.plan_type === 'premium' ? 'bg-[#ED7600] text-white' :
                  plan.plan_type === 'standard' ? 'bg-blue-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {plan.plan_type}
                </div>
            </div>
            
              <div className="mb-6">
                <div className="text-gray-600 text-sm mb-2">Price</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-gray-600">PKR</span>
                  <span className="text-4xl font-bold text-[#ED7600]">{plan.price.toLocaleString()}</span>
                  <span className="text-gray-600">/ {plan.duration_days} days</span>
                </div>
              </div>

              <p className="text-gray-600 mb-6">{plan.description}</p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-gray-900">
                  <span className="text-2xl">📢</span>
                  <span className="font-semibold">{plan.ad_limit} Advertisements</span>
                </div>
                {plan.features && plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-700">
                  <span className="text-green-500 font-bold text-xl">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {currentSubscription?.plan_id === plan._id ? (
              <button className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold cursor-not-allowed" disabled>
                Current Plan
              </button>
            ) : currentSubscription ? (
              <button className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold cursor-not-allowed" disabled>
                Already Subscribed
              </button>
            ) : (
              <button 
                onClick={() => handleSubscribe(plan._id)}
                className="w-full bg-[#ED7600] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#D56900] transition-colors disabled:opacity-50"
                disabled={subscribing}
              >
                {subscribing ? 'Subscribing...' : 'Subscribe Now'}
              </button>
            )}
          </div>
        ))}
      </div>

        {plans.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p>No subscription plans available at the moment.</p>
            <p className="mt-2">Please check back later.</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
