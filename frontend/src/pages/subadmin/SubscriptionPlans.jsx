import React, { useState, useEffect } from 'react';
import subscriptionAPI from '../../services/subscriptionAPI';
import './SubscriptionPlans.css';

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
      <div className="subscription-plans-container">
        <div className="loading">Loading subscription plans...</div>
      </div>
    );
  }

  return (
    <div className="subscription-plans-container">
      <div className="page-header">
        <h1>Subscription Plans</h1>
        <p>Choose a plan to start advertising your properties</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')} className="close-btn">×</button>
        </div>
      )}

      {/* Current Subscription */}
      {currentSubscription && (
        <div className="current-subscription-card">
          <h2>Your Current Subscription</h2>
          <div className="subscription-details">
            <div className="detail-row">
              <span className="label">Plan:</span>
              <span className="value">{currentSubscription.plan_name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Price:</span>
              <span className="value">PKR {currentSubscription.price.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Ad Limit:</span>
              <span className="value">
                {currentSubscription.ads_used} / {currentSubscription.ad_limit} ads used
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Subscribed:</span>
              <span className="value">{formatDate(currentSubscription.subscribed_at)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Expires:</span>
              <span className="value">{formatDate(currentSubscription.expiry_date)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Status:</span>
              <span className={`badge badge-${currentSubscription.status}`}>
                {currentSubscription.status}
              </span>
            </div>
          </div>
          {currentSubscription.status === 'active' && (
            <button 
              onClick={handleCancelSubscription}
              className="btn btn-danger"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      )}

      {/* Available Plans */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div 
            key={plan._id} 
            className={`plan-card ${plan.plan_type} ${
              currentSubscription?.plan_id === plan._id ? 'current' : ''
            }`}
          >
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-type-badge">{plan.plan_type}</div>
            </div>
            
            <div className="plan-price">
              <span className="currency">PKR</span>
              <span className="amount">{plan.price.toLocaleString()}</span>
              <span className="period">/ {plan.duration_days} days</span>
            </div>

            <p className="plan-description">{plan.description}</p>

            <div className="plan-features">
              <div className="feature-item">
                <span className="icon">📢</span>
                <span>{plan.ad_limit} Advertisements</span>
              </div>
              {plan.features && plan.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span className="icon">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {currentSubscription?.plan_id === plan._id ? (
              <button className="btn btn-current" disabled>
                Current Plan
              </button>
            ) : currentSubscription ? (
              <button className="btn btn-disabled" disabled>
                Already Subscribed
              </button>
            ) : (
              <button 
                onClick={() => handleSubscribe(plan._id)}
                className="btn btn-primary"
                disabled={subscribing}
              >
                {subscribing ? 'Subscribing...' : 'Subscribe Now'}
              </button>
            )}
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="no-plans">
          <p>No subscription plans available at the moment.</p>
          <p>Please check back later.</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
