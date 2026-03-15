import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'âš ï¸',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: 'âš ï¸',
          confirmButton: 'bg-[#ED7600] hover:bg-[#D56900] text-white',
          iconBg: 'bg-orange-100',
          iconColor: 'text-[#ED7600]'
        };
      case 'info':
        return {
          icon: 'â„¹ï¸',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      default:
        return {
          icon: 'â“',
          confirmButton: 'bg-[#ED7600] hover:bg-[#D56900] text-white',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 max-w-md w-full mx-4 p-6">
        {/* Icon */}
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} mb-4`}>
          <span className={`text-2xl ${styles.iconColor}`}>{styles.icon}</span>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-[#2F3D57] text-center mb-2">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
