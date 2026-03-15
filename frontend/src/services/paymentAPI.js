// frontend/src/services/paymentAPI.js
const API_BASE_URL = 'https://nextgen-ta95.onrender.com/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const paymentAPI = {
  /**
   * Create Stripe checkout session
   * @param {string} advertisementId - The advertisement ID
   * @param {string} planName - The plan name
   * @param {number} planPrice - The plan price
   * @returns {Promise} Response with checkout URL and session ID
   */
  createCheckoutSession: async (advertisementId, planName, planPrice) => {
    try {
      console.log('PaymentAPI: Creating checkout session', {
        advertisementId,
        planName,
        planPrice,
        url: `${API_BASE_URL}/payment/create-checkout-session`
      });

      const response = await fetch(`${API_BASE_URL}/payment/create-checkout-session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          advertisement_id: advertisementId,
          plan_name: planName,
          plan_price: planPrice
        })
      });

      console.log('PaymentAPI: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PaymentAPI: Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('PaymentAPI: Success response:', data);
      return data;
    } catch (error) {
      console.error('PaymentAPI: Error creating checkout session:', error);
      throw error;
    }
  },

  /**
   * Verify payment status
   * @param {string} sessionId - Stripe session ID
   * @returns {Promise} Payment verification result
   */
  verifyPayment: async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/verify-payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  /**
   * Handle payment success
   * @param {string} sessionId - Stripe session ID
   * @returns {Promise} Payment success result
   */
  handlePaymentSuccess: async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment/payment-success`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          session_id: sessionId
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }
};

export default paymentAPI;
