 import React, { useState } from 'react';
import Logo from '../../assets/Logo.png';
import { useNavigate } from 'react-router-dom';
import { signupUser, loginUser, checkEmail, googleLogin } from '../../services/apiService';
import PopupModal from '../../components/common/PopupModal';
import { useAuth } from '../../context/AuthContext';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';

const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(false);
    const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [signupError, setSignupError] = useState('');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [showSignupType, setShowSignupType] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    
    // Popup modal state with navigation callback
    const [popup, setPopup] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onOk: null // Callback function to execute when user clicks OK
    });
    
    const navigate = useNavigate();
    const { login } = useAuth(); // Use AuthContext login method

    // Handle Google OAuth Success (works for both login and signup)
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const mode = isLoginMode ? 'LOGIN' : 'SIGNUP';
            console.log(`[GOOGLE ${mode}] Starting Google authentication...`);
            console.log(`[GOOGLE ${mode}] Credential response:`, credentialResponse);
            
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
        
        if (type === 'society') {
            // First check if email already exists
            try {
                const emailCheck = await checkEmail(signupForm.email);
                
                if (emailCheck.exists) {
                    setSignupError('Email already exists. Please use a different email address.');
                    return;
                }
                
                // Email is available, proceed to registration form
                navigate('/registration-form', {
                    state: {
                        userEmail: signupForm.email,
                        userName: signupForm.name,
                        userPassword: signupForm.password
                    }
                });
            } catch (error) {
                setSignupError('Failed to verify email. Please try again.',error);
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
                    setIsLoginMode(true); // Switch to login mode
                };
                
                showPopup(
                    'Signup Successful!',
                    'Your account has been created successfully! Click OK to continue to login.',
                    'success',
                    handleUserSignupSuccess
                );
            } else {
                setSignupError(result.error || 'Signup failed');
            }
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
                    console.log('[LOGIN] Redirecting to user profile');
                    navigate('/userprofile');
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
        }
    };

    // Clear errors and forms on mode switch
    const handleModeSwitch = (e) => {
        e.preventDefault();
        setIsLoginMode(!isLoginMode);
        setSignupError('');
        setLoginError('');
        setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
        setLoginForm({ email: '', password: '' });
    };

    return (
        <div className="min-h-screen bg-[#2F3D57] flex items-center justify-center p-4">
            <div className='w-[500px] bg-white p-8 rounded-2xl shadow-lg'>
                {/* Logo and Company Name */}
                <div className='flex flex-col items-center mb-6 space-y-3'>
                    <div className='w-32 h-32'>
                        <img 
                            src={Logo} 
                            alt="NextGenArchitect Logo" 
                            className='w-full h-full object-contain'
                        />
                    </div>
                    <h1 className='text-3xl font-extrabold text-[#2F3D57] tracking-wide'>
                        <span className='bg-clip-text text-transparent bg-gradient-to-r from-[#2F3D57] to-[#ED7600]'>
                            NextGenArchitect
                        </span>
                    </h1>
                </div>

                {/* Toggle Buttons */}
                <div className='relative flex h-12 mb-6 border border-gray-300 rounded-full overflow-hidden'>
                    <button 
                        onClick={()=> setIsLoginMode(true)} 
                        className={`w-1/2 text-lg font-medium transition-all z-10 ${isLoginMode ? "text-white" : "text-[#2F3D57]"}`}
                    >
                        Login
                    </button>
                    <button 
                        onClick={()=> setIsLoginMode(false)} 
                        className={`w-1/2 text-lg font-medium transition-all z-10 ${!isLoginMode ? "text-white" : "text-[#2F3D57]"}`}
                    >
                        Sign Up
                    </button>
                    <div 
                        className={`absolute top-0 h-full w-1/2 rounded-full bg-gradient-to-r from-[#2F3D57] to-[#ED7600] ${isLoginMode ? "left-0" : "left-1/2"} transition-all duration-300`}
                    ></div>
                </div>

                {/* Form Section */}
                <form className='space-y-4' onSubmit={isLoginMode ? handleLoginSubmit : handleSignupSubmit}>
                    {!isLoginMode && (
                        <input 
                            type="text" 
                            name="name" 
                            value={signupForm.name} 
                            onChange={handleSignupInput} 
                            onKeyDown={handleKeyDown}
                            placeholder="Name" 
                            required 
                            className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400' 
                        />
                    )}
                    <input
                        type="email"
                        name="email"
                        value={isLoginMode ? loginForm.email : signupForm.email}
                        onChange={isLoginMode ? handleLoginInput : handleSignupInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Email Address"
                        required
                        className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'
                    />
                    <input
                        type="password"
                        name="password"
                        value={isLoginMode ? loginForm.password : signupForm.password}
                        onChange={isLoginMode ? handleLoginInput : handleSignupInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Password"
                        required
                        className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'
                    />
                    {!isLoginMode && (
                        <input 
                            type="password" 
                            name="confirmPassword" 
                            value={signupForm.confirmPassword} 
                            onChange={handleSignupInput} 
                            onKeyDown={handleKeyDown}
                            placeholder="Confirm Password" 
                            required 
                            className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'
                        />
                    )}
                    {signupError && !isLoginMode && (
                        <div className="text-red-600 text-sm font-semibold text-center">{signupError}</div>
                    )}
                    {loginError && isLoginMode && (
                        <div className="text-red-600 text-sm font-semibold text-center">{loginError}</div>
                    )}
                    {isLoginMode && (
                        <div className='text-right'>
                            <button 
                                type="button"
                                onClick={handleForgotPasswordClick}
                                className='text-[#ED7600] hover:underline cursor-pointer focus:outline-none'
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}
                    <button 
                        type="submit"
                        className='w-full p-3 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-full text-lg font-bold hover:opacity-90 transition shadow-lg'
                    >
                        {isLoginMode ? "Login" : "Sign Up"}
                    </button>

                    {/* Google OAuth - Show for both Login and Signup */}
                    <>
                        {/* Divider */}
                        <div className="flex items-center my-4">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-4 text-gray-500 text-sm">or</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        {/* Google OAuth Button */}
                        <div className="w-full">
                            <GoogleSignInButton
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                disabled={false}
                                mode={isLoginMode ? 'signin' : 'signup'}
                            />
                            <p className="text-xs text-gray-500 text-center mt-2">
                                {isLoginMode 
                                    ? "Sign in securely with your Google account" 
                                    : "Create your account instantly with Google"}
                            </p>
                        </div>
                    </>

                    <p className='text-center text-gray-600'>
                        {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            onClick={handleModeSwitch}
                            className='ml-1 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#2F3D57] to-[#ED7600] hover:underline'
                        >
                            {isLoginMode ? "Sign up now" : "Login"}
                        </button>
                    </p>
                </form>

                {/* Signup Type Modal */}
                {showSignupType && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center animate-fadeIn" style={{ minWidth: 340, minHeight: 220, position: 'relative' }}>
                            <h2 className="text-2xl font-bold mb-6 text-[#2F3D57] tracking-wide">Sign up as</h2>
                            <div className="flex gap-8 mb-6">
                                <button className="px-8 py-4 bg-gradient-to-r from-[#ED7600] to-[#2F3D57] text-white rounded-xl font-semibold text-lg shadow-lg hover:scale-105 transition-transform duration-200" onClick={() => handleSignupType('society')}>
                                    <span role="img" aria-label="Society" className="mr-2">🏢</span>Society
                                </button>
                                <button className="px-8 py-4 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-xl font-semibold text-lg shadow-lg hover:scale-105 transition-transform duration-200" onClick={() => handleSignupType('user')}>
                                    <span role="img" aria-label="User" className="mr-2">👤</span>User
                                </button>
                            </div>
                            <button className="absolute top-3 right-4 text-gray-400 hover:text-[#ED7600] text-xl font-bold" onClick={() => setShowSignupType(false)} title="Close">×</button>
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