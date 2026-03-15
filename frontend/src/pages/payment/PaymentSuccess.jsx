import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import paymentAPI from '../../services/paymentAPI';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success'); // 'success' or 'error'

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setModalMessage('Invalid payment session');
      setModalType('error');
      setShowModal(true);
      return;
    }

    // Verify and process payment
    const processPayment = async () => {
      try {
        const result = await paymentAPI.handlePaymentSuccess(sessionId);
        
        if (result.success) {
          setModalMessage('Payment successful! Your advertisement has been submitted for approval.');
          setModalType('success');
          setShowModal(true);
        } else {
          setModalMessage(result.error || 'Payment verification failed');
          setModalType('error');
          setShowModal(true);
        }
      } catch (error) {
        setModalMessage('Error verifying payment: ' + error.message);
        setModalType('error');
        setShowModal(true);
      }
    };

    processPayment();
  }, [searchParams]);

  const handleOkClick = () => {
    setShowModal(false);
    navigate('/subadmin/advertisement');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      {/* Loading state */}
      {!showModal && (
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 border-4 border-[#ED7600] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Processing Payment</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      )}

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2F3D57] flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200">
            {modalType === 'success' ? (
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-5xl">âœ“</span>
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-5xl">âœ—</span>
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {modalType === 'success' ? 'Payment Successful!' : 'Payment Error'}
            </h2>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            
            <button 
              className="w-full bg-[#ED7600] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#D56900] transition-colors"
              onClick={handleOkClick}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
