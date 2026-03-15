import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const isSociety = location.state?.isSociety || false;
  const userName = location.state?.userName || '';
  const userPassword = location.state?.userPassword || '';

  const verifyWithCode = async (codeToVerify) => {
    setVerifying(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('$API_URL/verify-email', {
        code: codeToVerify || code
      });

      if (response.data.success) {
        setVerified(true);
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Check if this is a society user
        if (isSociety) {
          // Redirect to registration form for society after verification
          setTimeout(() => {
            navigate('/registration-form', {
              state: {
                userEmail: email,
                userName: userName,
                userPassword: userPassword,
                verified: true
              }
            });
          }, 3000);
        } else {
          // Redirect regular users to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { state: { verified: true } });
          }, 3000);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Verification failed';
      setError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerify = async () => {
    if (!code) {
      setError('Please enter a 6-digit verification code');
      return;
    }
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Verification code must be 6 digits');
      return;
    }
    await verifyWithCode(code);
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('$API_URL/resend-verification-email', {
        email: email
      });

      if (response.data.success) {
        setMessage('Verification email sent! Please check your inbox.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to resend email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loader}>â³</div>
          <h2 style={styles.title}>Verifying Your Email...</h2>
          <p style={styles.text}>Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>âœ…</div>
          <h2 style={styles.title}>Email Verified Successfully!</h2>
          <p style={styles.successText}>{message}</p>
          <p style={styles.text}>
            {isSociety 
              ? 'Redirecting to society registration form...' 
              : 'Redirecting to login page...'}
          </p>
          <button 
            onClick={() => isSociety 
              ? navigate('/registration-form', { 
                  state: { userEmail: email, userName, userPassword, verified: true } 
                }) 
              : navigate('/login')}
            style={styles.button}
          >
            {isSociety ? 'Go to Registration Form' : 'Go to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>ðŸ“§</div>
          <h1 style={styles.title}>Email Verification</h1>
          <p style={styles.subtitle}>NextGen Architect</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>âŒ</span>
            <div>
              <strong>Verification Failed</strong>
              <p style={styles.errorText}>{error}</p>
            </div>
          </div>
        )}

        {message && !error && (
          <div style={styles.successBox}>
            <span style={styles.successIcon}>âœ…</span>
            <p style={styles.successText}>{message}</p>
          </div>
        )}

        {/* Manual Code Entry */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Enter Your Verification Code</h3>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(value);
            }}
            maxLength="6"
            style={{...styles.input, ...styles.codeInput}}
          />
          <button
            onClick={handleManualVerify}
            disabled={!code || verifying || code.length !== 6}
            style={{
              ...styles.button,
              ...(!code || code.length !== 6 ? styles.buttonDisabled : {})
            }}
          >
            {verifying ? 'â³ Verifying...' : 'Verify Email'}
          </button>
        </div>

        {/* Resend Email */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Didn't Receive Email?</h3>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleResendEmail}
            disabled={!email || loading}
            style={{
              ...styles.buttonSecondary,
              ...(!email ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'â³ Sending...' : 'ðŸ“§ Resend Verification Email'}
          </button>
        </div>

        {/* Help Section */}
        <div style={styles.helpBox}>
          <div style={styles.helpIcon}>ðŸ“¬</div>
          <h4 style={styles.helpTitle}>Email Verification Help</h4>
          <ul style={styles.helpList}>
            <li>Check your Gmail inbox for the verification email</li>
            <li>Look in your spam/junk folder if you don't see it</li>
            <li>Verification codes expire after 10 minutes</li>
            <li>Enter the 6-digit code from the email</li>
            <li>Only Gmail addresses are accepted</li>
          </ul>
        </div>

        <div style={styles.footer}>
          <button 
            onClick={() => navigate('/login')}
            style={styles.linkButton}
          >
            â† Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#2F3D57',
    padding: '20px'
  },
  card: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    padding: '40px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  logo: {
    fontSize: '60px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #2F3D57',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '10px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ED7600',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  buttonSecondary: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ED7600',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed'
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '15px',
    backgroundColor: '#fee',
    borderLeft: '4px solid #f44336',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  errorIcon: {
    fontSize: '24px',
    marginRight: '15px'
  },
  errorText: {
    color: '#d32f2f',
    margin: '5px 0 0 0'
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#e8f5e9',
    borderLeft: '4px solid #4CAF50',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  successText: {
    color: '#2e7d32',
    margin: '0',
    marginLeft: '15px'
  },
  helpBox: {
    padding: '20px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    marginTop: '30px'
  },
  helpIcon: {
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '10px'
  },
  helpTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: '10px'
  },
  helpList: {
    color: '#555',
    fontSize: '14px',
    lineHeight: '1.8',
    paddingLeft: '20px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '30px'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '16px',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  loader: {
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '20px'
  },
  text: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px'
  },
  codeInput: {
    fontSize: '24px',
    letterSpacing: '8px',
    textAlign: 'center',
    fontWeight: 'bold',
    border: '2px solid #ED7600'
  }
};

export default EmailVerification;
