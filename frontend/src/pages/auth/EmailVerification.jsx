import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import QuickVerify from '../../components/QuickVerify';

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      setToken(urlToken);
      // Auto-verify if token is in URL
      verifyWithToken(urlToken);
    }
  }, [location]);

  const verifyWithToken = async (tokenToVerify) => {
    setVerifying(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/verify-email', {
        token: tokenToVerify || token
      });

      if (response.data.success) {
        setVerified(true);
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { verified: true } });
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Verification failed';
      setError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerify = async () => {
    if (!token) {
      setError('Please enter a verification token');
      return;
    }
    await verifyWithToken(token);
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
      const response = await axios.post('http://localhost:5000/api/resend-verification-email', {
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

  const handleQuickVerified = () => {
    setVerified(true);
    setMessage('Email verified successfully! Redirecting to login...');
    setTimeout(() => {
      navigate('/login', { state: { verified: true } });
    }, 2000);
  };

  if (verifying) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loader}>⏳</div>
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
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.title}>Email Verified Successfully!</h2>
          <p style={styles.successText}>{message}</p>
          <p style={styles.text}>Redirecting to login page...</p>
          <button 
            onClick={() => navigate('/login')}
            style={styles.button}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>📧</div>
          <h1 style={styles.title}>Email Verification</h1>
          <p style={styles.subtitle}>NextGen Architect</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>❌</span>
            <div>
              <strong>Verification Failed</strong>
              <p style={styles.errorText}>{error}</p>
            </div>
          </div>
        )}

        {message && !error && (
          <div style={styles.successBox}>
            <span style={styles.successIcon}>✅</span>
            <p style={styles.successText}>{message}</p>
          </div>
        )}

        {/* Manual Token Entry */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Have a Verification Token?</h3>
          <input
            type="text"
            placeholder="Enter your verification token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleManualVerify}
            disabled={!token || verifying}
            style={{
              ...styles.button,
              ...(!token ? styles.buttonDisabled : {})
            }}
          >
            {verifying ? '⏳ Verifying...' : 'Verify Email'}
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
            {loading ? '⏳ Sending...' : '📧 Resend Verification Email'}
          </button>
        </div>

        {/* Quick Verify - Only in Development */}
        <QuickVerify 
          email={email} 
          onVerified={handleQuickVerified}
        />

        {/* Help Section */}
        <div style={styles.helpBox}>
          <div style={styles.helpIcon}>📬</div>
          <h4 style={styles.helpTitle}>Email Verification Help</h4>
          <ul style={styles.helpList}>
            <li>Check your Gmail inbox for the verification email</li>
            <li>Look in your spam/junk folder if you don't see it</li>
            <li>Verification links expire after 24 hours</li>
            <li>Only Gmail addresses are accepted</li>
          </ul>
        </div>

        <div style={styles.footer}>
          <button 
            onClick={() => navigate('/login')}
            style={styles.linkButton}
          >
            ← Back to Login
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '10px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#667eea',
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
    backgroundColor: '#4CAF50',
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
  }
};

export default EmailVerification;
