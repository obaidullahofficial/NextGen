import React from 'react';

const PopupModal = ({ isOpen, onClose, title, message, type = "info" }) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          iconBg: 'bg-green-100',
          icon: '✓',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          iconBg: 'bg-red-100',
          icon: '✕',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          icon: '⚠',
          iconColor: 'text-yellow-600',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          iconBg: 'bg-blue-100',
          icon: 'ℹ',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50">
      <div className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-white/20 border-t-4 ${styles.borderColor} animate-fadeIn`}>
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center mr-4`}>
            <span className={`text-2xl font-bold ${styles.iconColor}`}>
              {styles.icon}
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#2F3D57]">{title}</h3>
        </div>
        
        <p className="text-gray-700 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            OK
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
      `}</style>
    </div>
  );
};

export default PopupModal;