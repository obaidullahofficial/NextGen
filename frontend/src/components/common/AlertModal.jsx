import React from 'react';

const AlertModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  buttonText = 'OK' 
}) => {
  if (!isOpen) return null;

  // Theme colors and icons based on type
  const getThemeStyles = () => {
    switch (type) {
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-500',
          buttonBg: 'bg-green-600 hover:bg-green-700',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'error':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-500',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          borderColor: 'border-yellow-500',
          buttonBg: 'bg-[#ED7600] hover:bg-[#D56900]',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        };
      default: // info
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-500',
          buttonBg: 'bg-[#ED7600] hover:bg-[#D56900]',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const themeStyles = getThemeStyles();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className={`bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 max-w-md w-full mx-4 transform transition-all duration-200 border-t-4 ${themeStyles.borderColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-center p-6 pb-4">
          <div className={`flex-shrink-0 ${themeStyles.iconBg} ${themeStyles.iconColor} w-12 h-12 rounded-full flex items-center justify-center mr-4`}>
            {themeStyles.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#2F3D57] mb-1">
              {title}
            </h3>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 pb-6">
          <p className="text-gray-700 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer with Button */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 ${themeStyles.buttonBg} text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED7600]`}
            autoFocus
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
