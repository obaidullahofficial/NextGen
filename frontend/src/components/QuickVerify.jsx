import React, { useState } from 'react';
import axios from 'axios';

/**
 * Quick Verify Component - For Testing & Development
 * Allows instant email verification without checking email
 */
const QuickVerify = ({ email, onVerified, showAlways = false }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Only show in development mode unless showAlways is true
  const isDevelopment = process.env.NODE_ENV === 'development' || showAlways;

  if (!isDevelopment) return null;

  const handleQuickVerify = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setIsVerifying(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/manual-verify-email', {
        email: email
      });

      if (response.data.success) {
        setMessage(response.data.message || 'Email verified successfully! ✅');
        
        // Call the onVerified callback if provided
        if (onVerified) {
          setTimeout(() => onVerified(), 1500);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Verification failed';
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="quick-verify-container" style={styles.container}>
      <div style={styles.badge}>🧪 DEV MODE</div>
      
      <button
        onClick={handleQuickVerify}
        disabled={isVerifying || !email}
        style={{
          ...styles.button,
          ...(isVerifying ? styles.buttonDisabled : {}),
          ...(!email ? styles.buttonDisabled : {})
        }}
      >
        {isVerifying ? '⏳ Verifying...' : '⚡ Quick Verify Email'}
      </button>

      {message && (
        <div style={styles.success}>
          ✅ {message}
        </div>
      )}

      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}

      <div style={styles.info}>
        <small>
          ⚡ Skip email verification for testing<br />
          Email: <strong>{email || 'Not provided'}</strong>
        </small>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '20px',
    padding: '15px',
    border: '2px dashed #ffa500',
    borderRadius: '8px',
    backgroundColor: '#fff8e1',
    textAlign: 'center'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#ff9800',
    color: 'white',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '10px'
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed'
  },
  success: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    border: '1px solid #c3e6cb'
  },
  error: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    border: '1px solid #f5c6cb'
  },
  info: {
    marginTop: '10px',
    color: '#666',
    fontSize: '13px',
    lineHeight: '1.5'
  }
};

export default QuickVerify;
