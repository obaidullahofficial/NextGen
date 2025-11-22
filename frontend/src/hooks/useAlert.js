import { useState, useCallback } from 'react';

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onClose: null
  });

  const showAlert = useCallback((title, message, type = 'info', onClose = null) => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        onClose: () => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          if (onClose) onClose();
          resolve();
        }
      });
    });
  }, []);

  const closeAlert = useCallback(() => {
    if (alertState.onClose) {
      alertState.onClose();
    }
  }, [alertState.onClose]);

  // Convenience methods for different alert types
  const showSuccess = useCallback((title, message, onClose) => {
    return showAlert(title, message, 'success', onClose);
  }, [showAlert]);

  const showError = useCallback((title, message, onClose) => {
    return showAlert(title, message, 'error', onClose);
  }, [showAlert]);

  const showWarning = useCallback((title, message, onClose) => {
    return showAlert(title, message, 'warning', onClose);
  }, [showAlert]);

  const showInfo = useCallback((title, message, onClose) => {
    return showAlert(title, message, 'info', onClose);
  }, [showAlert]);

  return {
    alertState,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert
  };
};
