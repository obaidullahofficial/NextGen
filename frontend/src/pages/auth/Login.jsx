import React, { useState, useEffect } from 'react';
import Logo from '../../assets/Logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { signupUser, loginUser, checkEmail, googleLogin } from '../../services/apiService';
import PopupModal from '../../components/common/PopupModal';
import { useAuth } from '../../context/AuthContext';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';

const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [signupError, setSignupError] = useState('');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [showSignupType, setShowSignupType] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    
    // Popup modal state with navigation callback
    const [popup, setPopup] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onOk: null // Callback function to execute when user clicks OK
    });
    
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Set initial mode based on the URL path
    useEffect(() => {
        if (location.pathname === '/signup') {
            setIsLoginMode(false);
        } else {
            setIsLoginMode(true);
        }
    }, [location.pathname]); // Use AuthContext login method

    // Handle Google OAuth Success (works for both login and signup)
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setIsGoogleLoading(true);
            const mode = isLoginMode ? 'LOGIN' : 'SIGNUP';
            console.log(`[GOOGLE ${mode}] Starting Google authentication...`);
            
            if (!credentialResponse.credential) {
                throw new Error('No credential received from Google');
            }
            
            // Call Google login API (this handles both login and signup)
            const intent = isLoginMode ? 'login' : 'signup';
            const result = await googleLogin(credentialResponse.credential, intent);
            console.log(`[GOOGLE ${mode}] Backend response:`, result);
            
            if (result.success) {
                console.log(`[GOOGLE ${mode}] Authentication successful:`, result.user);
                
                // Store token in localStorage
                localStorage.setItem('token', result.access_token);
                
                // Show success popup
                const handleGoogleAuthSuccess = () => {
                    if (result.user.role === 'admin') {
                        console.log(`[GOOGLE ${mode}] Redirecting to admin dashboard`);
                        navigate('/dashboard');
                    } else if (result.user.role === 'society') {
                        console.log(`[GOOGLE ${mode}] Redirecting to society dashboard`);
                        navigate('/subadmin');
                    } else {
                        console.log(`[GOOGLE ${mode}] Redirecting to user profile`);
                        navigate('/userprofile');
                    }
                };
                
                let title, message;
                if (result.new_user) {
                    title = 'Welcome to NextGenArchitect!';
                    message = 'Your account has been created successfully with Google. You can now access all features of our platform.';
                } else {
                    title = isLoginMode ? 'Welcome Back!' : 'Account Found!';
                    message = isLoginMode 
                        ? 'You have been signed in successfully with Google.' 
                        : 'We found your existing account and signed you in automatically.';
                }
                
                showPopup(
                    title,
                    message,
                    'success',
                    handleGoogleAuthSuccess
                );
            } else {
                console.error(`[GOOGLE ${mode}] Backend returned error:`, result);
                // Handle Google auth errors
                if (result.error?.includes('registration_pending')) {
                    showPopup(
                        'Registration Pending',
                        'Your society registration request is still being processed. Please wait for admin approval.',
                        'warning'
                    );
                } else if (result.error?.includes('registration_rejected')) {
                    showPopup(
                        'Registration Rejected',
                        'Unfortunately, your society registration request has been rejected. Please contact support.',
                        'error'
                    );
                } else {
                    const errorMessage = isLoginMode 
                        ? 'Google sign-in failed. Please try again.'
                        : 'Google sign-up failed. Please try again.';
                    setLoginError(result.message || result.error || errorMessage);
                    setSignupError(result.message || result.error || errorMessage);
                }
            }
        } catch (error) {
            console.error(`[GOOGLE ${isLoginMode ? 'LOGIN' : 'SIGNUP'}] Error:`, error);
            const errorMessage = isLoginMode 
                ? `Google sign-in failed: ${error.message}`
                : `Google sign-up failed: ${error.message}`;
            setLoginError(errorMessage);
            setSignupError(errorMessage);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    // Handle Google OAuth Error
    const handleGoogleError = (error) => {
        const mode = isLoginMode ? 'sign-in' : 'sign-up';
        console.error(`[GOOGLE ${mode.toUpperCase()}] Google ${mode} error:`, error);
        const errorMessage = `Google ${mode} was cancelled or failed. Please try again.`;
        setLoginError(errorMessage);
        setSignupError(errorMessage);
    };

    // Handle forgot password
    const handleForgotPasswordClick = () => {
        setShowForgotPassword(true);
    };

    const handleForgotPasswordSuccess = (message) => {
        showPopup(
            'Password Reset Successful!',
            message,
            'success'
        );
    };

    // Handle Enter key press for form submission
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isLoginMode) {
                handleLoginSubmit(e);
            } else {
                handleSignupSubmit(e);
            }
        }
    };

    // Handle input for signup and login
    const handleSignupInput = (e) => {
        setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
    };
    const handleLoginInput = (e) => {
        setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    };

    // Signup validation
    const validateSignup = () => {
        const { name, email, password, confirmPassword } = signupForm;
        if (!name || !email || !password || !confirmPassword) {
            setSignupError('All fields are required.');
            return false;
        }
        // Restrict to Gmail addresses only
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setSignupError('Only Gmail addresses (@gmail.com) are allowed.');
            return false;
        }
        if (password !== confirmPassword) {
            setSignupError('Passwords do not match.');
            return false;
        }
        if (password.length < 8) {
            setSignupError('Password must be at least 8 characters.');
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            setSignupError('Password must contain at least one uppercase letter.');
            return false;
        }
        if (!/[a-z]/.test(password)) {
            setSignupError('Password must contain at least one lowercase letter.');
            return false;
        }
        if (!/[0-9]/.test(password)) {
            setSignupError('Password must contain at least one number.');
            return false;
        }
        setSignupError('');
        return true;
    };

    // Signup submit
    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        if (validateSignup()) {
            setShowSignupType(true);
        }
    };

    // Handle signup type (user or society)
    const handleSignupType = async (type) => {
        setShowSignupType(false);
        setIsLoading(true);
        
        try {
            if (type === 'society') {
                // Call backend API for society signup with email verification
                const result = await signupUser({
                    username: signupForm.name,
                    email: signupForm.email,
                    password: signupForm.password,
                    role: 'society'
                });
                
                if (result.user_id) {
                    const handleSocietySignupSuccess = () => {
                        setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
                        setSignupError('');
                        // Redirect to email verification page with society user's email
                        navigate('/verify-email', { 
                            state: { 
                                email: signupForm.email,
                                isSociety: true,
                                userName: signupForm.name,
                                userPassword: signupForm.password
                            } 
                        });
                    };
                    
                    showPopup(
                        'Check Your Email!',
                        'We sent a 6-digit verification code to your email. Please verify your email first, then you can complete your society registration.',
                        'success',
                        handleSocietySignupSuccess
                    );
                } else {
                    // Display clear error message for duplicate email
                    const errorMessage = result.error || result.message || 'Signup failed. Please try again.';
                    setSignupError(errorMessage);
                    
                    // Show popup for email already exists
                    if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
                        showPopup(
                            'Email Already Exists',
                            errorMessage,
                            'error',
                            null
                        );
                    }
                }
            } else {
                // Call backend API for user signup
                const result = await signupUser({
                    username: signupForm.name,
                    email: signupForm.email,
                    password: signupForm.password,
                    role: 'user'
                });
                
                if (result.user_id) {
                    const handleUserSignupSuccess = () => {
                        setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
                        setSignupError('');
                        // Redirect to email verification page with user's email
                        navigate('/verify-email', { state: { email: signupForm.email } });
                    };
                    
                    showPopup(
                        'Check Your Email!',
                        'We sent a 6-digit verification code to your email. Please check your inbox and enter the code to verify your account.',
                        'success',
                        handleUserSignupSuccess
                    );
                } else {
                    // Display clear error message for duplicate email
                    const errorMessage = result.error || result.message || 'Signup failed. Please try again.';
                    setSignupError(errorMessage);
                    
                    // Show popup for email already exists
                    if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
                        showPopup(
                            'Email Already Exists',
                            errorMessage,
                            'error',
                            null
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            setSignupError('Email already exists. Please use a different email address.');
        } finally {
            setIsLoading(false);
        }
    };

    // Show popup modal with optional callback
    const showPopup = (title, message, type = 'info', onOk = null) => {
        setPopup({
            isOpen: true,
            title,
            message,
            type,
            onOk
        });
    };

    // Close popup modal and execute callback if provided
    const closePopup = () => {
        const currentOnOk = popup.onOk;
        setPopup({
            isOpen: false,
            title: '',
            message: '',
            type: 'info',
            onOk: null
        });
        
        // Execute callback after closing popup
        if (currentOnOk && typeof currentOnOk === 'function') {
            currentOnOk();
        }
    };

    // Login submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError(''); // Clear previous errors
        setIsLoading(true);
        
        try {
            console.log('[LOGIN] Attempting login with:', { email: loginForm.email });
            
            // Use AuthContext login method instead of direct API call
            const userData = await login(loginForm.email, loginForm.password);
            
            console.log('[LOGIN] AuthContext login successful:', userData);
            
            // Show success popup and wait for user to click OK before navigating
            const handleLoginSuccess = () => {
                if (userData.role === 'admin') {
                    console.log('[LOGIN] Redirecting to admin dashboard');
                    navigate('/dashboard');
                } else if (userData.role === 'society') {
                    console.log('[LOGIN] Redirecting to society dashboard');
                    navigate('/subadmin');
                } else {
                    console.log('[LOGIN] Redirecting to home page with user ID:', userData.id);
                    // Redirect to home page with user ID
                    navigate('/', { state: { userId: userData.id } });
                }
            };
            
            showPopup(
                'Login Successful!',
                'Welcome back! Click OK to continue to your dashboard.',
                'success',
                handleLoginSuccess
            );
            
        } catch (error) {
            console.log('[LOGIN] Login failed:', error);
            
            // Handle specific error types for society users
            if (error.message?.includes('registration_pending')) {
                showPopup(
                    'Registration Pending',
                    'Your society registration request is still being processed. Please wait for admin approval before you can access your dashboard. You will get access to the portal once approved.',
                    'warning'
                );
            } else if (error.message?.includes('registration_rejected')) {
                showPopup(
                    'Registration Rejected',
                    'Unfortunately, your society registration request has been rejected by the administrator. Please contact support at admin@nextgenarchitect.com for queries.',
                    'error'
                );
            } else if (error.message?.includes('registration_invalid')) {
                showPopup(
                    'Registration Status Issue', 
                    'There appears to be an issue with your registration status in our system. Please contact the administrator at admin@nextgenarchitect.com for immediate assistance.',
                    'error'
                );
            } else if (error.message?.includes('Invalid password')) {
                setLoginError('Invalid email or password. Please try again.');
            } else if (error.message?.includes('User not found')) {
                setLoginError('No account found with this email address.');
            } else {
                // Generic error - could be from status messages or other errors
                setLoginError(error.message || 'Login failed. Please check your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Clear errors and forms on mode switch
    const handleModeSwitch = (e) => {
        e.preventDefault();
        if (isLoading || isGoogleLoading) return; // Prevent switching during loading
        
        setIsLoginMode(!isLoginMode);
        setSignupError('');
        setLoginError('');
        setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
        setLoginForm({ email: '', password: '' });
    };

    // Enhanced validation with real-time feedback
    const validateField = (field, value, formType = 'signup') => {
        switch (field) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) return 'Email is required';
                if (!emailRegex.test(value)) return 'Please enter a valid email address';
                return '';
            case 'password':
                if (!value) return 'Password is required';
                if (formType === 'signup') {
                    if (value.length < 8) return 'Password must be at least 8 characters';
                    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
                    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
                    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
                }
                return '';
            case 'name':
                if (!value.trim()) return 'Name is required';
                if (value.trim().length < 2) return 'Name must be at least 2 characters';
                return '';
            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== signupForm.password) return 'Passwords do not match';
                return '';
            default:
                return '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#2F3D57] via-[#3a4b66] to-[#2F3D57] flex items-center justify-center p-3 sm:p-4 lg:p-6">
            <div className='w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-2xl transform hover:scale-[1.01] transition-all duration-300'>
                {/* Logo and Company Name */}
                <div className='flex flex-col items-center mb-4 sm:mb-6 space-y-2 sm:space-y-3'>
                    <div className='w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32'>
                        <img 
                            src={Logo} 
                            alt="NextGenArchitect Logo" 
                            className='w-full h-full object-contain drop-shadow-lg'
                        />
                    </div>
                    <h1 className='text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#2F3D57] tracking-wide text-center'>
                        <span className='bg-clip-text text-transparent bg-gradient-to-r from-[#2F3D57] to-[#ED7600]'>
                            NextGenArchitect
                        </span>
                    </h1>
                    <p className='text-xs sm:text-sm text-gray-600 text-center max-w-xs'>
                        {isLoginMode ? 'Welcome back! Sign in to your account' : 'Create your account to get started'}
                    </p>
                </div>

                {/* Toggle Buttons */}
                <div className='relative flex h-10 sm:h-12 mb-4 sm:mb-6 border border-gray-300 rounded-full overflow-hidden shadow-inner'>
                    <button 
                        onClick={()=> {
                            setIsLoginMode(true);
                            setLoginError('');
                            setSignupError('');
                        }} 
                        disabled={isLoading || isGoogleLoading}
                        className={`w-1/2 text-sm sm:text-lg font-medium transition-all z-10 disabled:cursor-not-allowed ${
                            isLoginMode ? "text-white" : "text-[#2F3D57] hover:text-[#ED7600]"
                        }`}
                    >
                        Login
                    </button>
                    <button 
                        onClick={()=> {
                            setIsLoginMode(false);
                            setLoginError('');
                            setSignupError('');
                        }} 
                        disabled={isLoading || isGoogleLoading}
                        className={`w-1/2 text-sm sm:text-lg font-medium transition-all z-10 disabled:cursor-not-allowed ${
                            !isLoginMode ? "text-white" : "text-[#2F3D57] hover:text-[#ED7600]"
                        }`}
                    >
                        Sign Up
                    </button>
                    <div 
                        className={`absolute top-0 h-full w-1/2 rounded-full bg-gradient-to-r from-[#2F3D57] to-[#ED7600] shadow-lg ${
                            isLoginMode ? "left-0" : "left-1/2"
                        } transition-all duration-300 ease-in-out`}
                    ></div>
                </div>

                {/* Form Section */}
                <form className='space-y-3 sm:space-y-4' onSubmit={isLoginMode ? handleLoginSubmit : handleSignupSubmit}>
                    {!isLoginMode && (
                        <div className="relative">
                            <input 
                                type="text" 
                                name="name" 
                                value={signupForm.name} 
                                onChange={handleSignupInput} 
                                onKeyDown={handleKeyDown}
                                placeholder="Full Name" 
                                required 
                                disabled={isLoading}
                                className='w-full p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg outline-none focus:border-[#ED7600] focus:ring-2 focus:ring-[#ED7600]/20 placeholder-gray-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base' 
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                        </div>
                    )}
                    <div className="relative">
                        <input
                            type="email"
                            name="email"
                            value={isLoginMode ? loginForm.email : signupForm.email}
                            onChange={isLoginMode ? handleLoginInput : handleSignupInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Email Address"
                            required
                            disabled={isLoading}
                            className='w-full p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg outline-none focus:border-[#ED7600] focus:ring-2 focus:ring-[#ED7600]/20 placeholder-gray-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base'
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                            </svg>
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            name="password"
                            value={isLoginMode ? loginForm.password : signupForm.password}
                            onChange={isLoginMode ? handleLoginInput : handleSignupInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Password"
                            required
                            disabled={isLoading}
                            className='w-full p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg outline-none focus:border-[#ED7600] focus:ring-2 focus:ring-[#ED7600]/20 placeholder-gray-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base'
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                        </div>
                    </div>
                    {!isLoginMode && (
                        <div className="relative">
                            <input 
                                type="password" 
                                name="confirmPassword" 
                                value={signupForm.confirmPassword} 
                                onChange={handleSignupInput} 
                                onKeyDown={handleKeyDown}
                                placeholder="Confirm Password" 
                                required 
                                disabled={isLoading}
                                className='w-full p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg outline-none focus:border-[#ED7600] focus:ring-2 focus:ring-[#ED7600]/20 placeholder-gray-400 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base'
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    )}
                    
                    {/* Error Messages */}
                    {signupError && !isLoginMode && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-pulse">
                            <div className="flex items-start">
                                <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span className="text-red-700 text-xs sm:text-sm font-medium">{signupError}</span>
                            </div>
                        </div>
                    )}
                    {loginError && isLoginMode && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-pulse">
                            <div className="flex items-start">
                                <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span className="text-red-700 text-xs sm:text-sm font-medium">{loginError}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Forgot Password */}
                    {isLoginMode && (
                        <div className='text-right'>
                            <button 
                                type="button"
                                onClick={handleForgotPasswordClick}
                                disabled={isLoading}
                                className='text-[#ED7600] hover:text-[#2F3D57] hover:underline cursor-pointer focus:outline-none transition-colors duration-200 text-xs sm:text-sm font-medium disabled:opacity-50'
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}
                    
                    {/* Submit Button */}
                    <button 
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        className='w-full p-2.5 sm:p-3 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-lg text-sm sm:text-lg font-bold hover:from-[#ED7600] hover:to-[#2F3D57] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center'
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isLoginMode ? "Signing in..." : "Creating account..."}
                            </>
                        ) : (
                            isLoginMode ? "Sign In" : "Create Account"
                        )}
                    </button>

                    {/* Google OAuth - Show for both Login and Signup */}
                    <>
                        {/* Divider */}
                        <div className="flex items-center my-3 sm:my-4">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-3 sm:px-4 text-gray-500 text-xs sm:text-sm font-medium">or continue with</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        {/* Google OAuth Button */}
                        <div className="w-full">
                            <GoogleSignInButton
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                disabled={isLoading || isGoogleLoading}
                                mode={isLoginMode ? 'signin' : 'signup'}
                            />
                            {isGoogleLoading && (
                                <div className="flex items-center justify-center mt-2">
                                    <svg className="animate-spin h-4 w-4 text-[#ED7600] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-xs text-gray-600">Connecting with Google...</span>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 text-center mt-2">
                                {isLoginMode 
                                    ? "Sign in securely with your Google account" 
                                    : "Create your account instantly with Google"}
                            </p>
                        </div>
                    </>

                    {/* Switch Mode */}
                    <div className="pt-2 sm:pt-4">
                        <p className='text-center text-gray-600 text-xs sm:text-sm'>
                            {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                onClick={handleModeSwitch}
                                disabled={isLoading || isGoogleLoading}
                                className='ml-1 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2F3D57] to-[#ED7600] hover:underline transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {isLoginMode ? "Sign up now" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </form>

                {/* Signup Type Modal */}
                {showSignupType && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 flex flex-col items-center animate-fadeIn max-w-sm sm:max-w-md w-full mx-4" style={{ position: 'relative' }}>
                            <button 
                                className="absolute top-3 right-4 text-gray-400 hover:text-[#ED7600] text-xl font-bold transition-colors duration-200" 
                                onClick={() => setShowSignupType(false)} 
                                disabled={isLoading}
                                title="Close"
                            >
                                ×
                            </button>
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#2F3D57] tracking-wide text-center">Choose Account Type</h2>
                            <p className="text-xs sm:text-sm text-gray-600 text-center mb-6 max-w-xs">
                                Select the type of account you want to create
                            </p>
                            
                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex items-center justify-center mb-4">
                                    <svg className="animate-spin h-5 w-5 text-[#ED7600] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-sm text-gray-600">Processing...</span>
                                </div>
                            )}
                            
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6 w-full">
                                <button 
                                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#ED7600] to-[#2F3D57] text-white rounded-xl font-semibold text-sm sm:text-lg shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center" 
                                    onClick={() => handleSignupType('society')}
                                    disabled={isLoading}
                                >
                                    <span role="img" aria-label="Society" className="mr-2 text-base sm:text-lg">🏢</span>
                                    <span>Society</span>
                                </button>
                                <button 
                                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-xl font-semibold text-sm sm:text-lg shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center" 
                                    onClick={() => handleSignupType('user')}
                                    disabled={isLoading}
                                >
                                    <span role="img" aria-label="User" className="mr-2 text-base sm:text-lg">👤</span>
                                    <span>User</span>
                                </button>
                            </div>
                            
                            <div className="text-xs text-gray-500 text-center max-w-xs">
                                <p><strong>Society:</strong> For housing societies and property developers</p>
                                <p><strong>User:</strong> For individual homeowners and buyers</p>
                            </div>
                        </div>
                        <style>{`
                            @keyframes fadeIn {
                                from { opacity: 0; transform: scale(0.95); }
                                to { opacity: 1; transform: scale(1); }
                            }
                            .animate-fadeIn { animation: fadeIn 0.3s ease; }
                        `}</style>
                    </div>
                )}
            </div>
            
            {/* Popup Modal */}
            <PopupModal 
                isOpen={popup.isOpen}
                onClose={closePopup}
                title={popup.title}
                message={popup.message}
                type={popup.type}
            />

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
                onSuccess={handleForgotPasswordSuccess}
            />
        </div>
    );
};

export default Login;