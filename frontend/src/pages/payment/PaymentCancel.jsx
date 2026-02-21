import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);

  const handleOkClick = () => {
    setShowModal(false);
    navigate('/subadmin/advertisement');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2F3D57] flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-5xl">⚠</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Cancelled</h2>
            <p className="text-gray-600 mb-3">Your payment was cancelled. Don't worry, your advertisement has been saved as a draft.</p>
            <p className="text-gray-500 text-sm mb-6">You can complete the payment anytime from your advertisements page.</p>
            
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

export default PaymentCancel;
