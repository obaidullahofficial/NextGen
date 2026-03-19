import { useState } from 'react';

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning',
    onConfirm: () => {},
    onClose: () => {}
  });

  const showConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          resolve(true);
          closeConfirm();
        },
        onClose: () => {
          resolve(false);
          closeConfirm();
        }
      });
    });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  return {
    confirmState,
    showConfirm,
    closeConfirm
  };
};
