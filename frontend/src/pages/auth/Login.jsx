 import React, { useState } from 'react';
import Logo from '../../assets/Logo.png';
import { useNavigate } from 'react-router-dom';
import { signupUser, loginUser, checkEmail } from '../../services/apiService';
import PopupModal from '../../components/common/PopupModal';

const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(false);
    const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [signupError, setSignupError] = useState('');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [showSignupType, setShowSignupType] = useState(false);
    
    // Popup modal state with navigation callback
    const [popup, setPopup] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onOk: null // Callback function to execute when user clicks OK
    });
    
    const navigate = useNavigate();

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
            
            const result = await loginUser({
                email: loginForm.email,
                password: loginForm.password
            });
            
            console.log('[LOGIN] Server response:', {
                success: result.success,
                hasToken: !!result.access_token,
                role: result.role,
                profileComplete: result.profile_complete,
                error: result.error,
                status: result.status
            });
            
            // Check for successful login first
            if (result.success === true && result.access_token) {
                // Successful login
                console.log('[LOGIN] Storing token:', {
                    tokenLength: result.access_token.length,
                    tokenStart: result.access_token.substring(0, 50) + '...'
                });
                
                localStorage.setItem('token', result.access_token);
                
                // Store user data for ProtectedSubAdminRoute
                const userData = {
                    email: loginForm.email,
                    role: result.role,
                    is_admin: result.is_admin,
                    profile_complete: result.profile_complete,
                    profile_exists: result.profile_exists,
                    missing_fields: result.missing_fields
                };
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Immediately verify the stored token
                const storedToken = localStorage.getItem('token');
                console.log('[LOGIN] Token stored successfully:', {
                    stored: !!storedToken,
                    same: storedToken === result.access_token
                });
                console.log('[LOGIN] User data stored:', userData);
                
                // Decode and check the token
                try {
                    const payload = JSON.parse(atob(result.access_token.split('.')[1]));
                    const currentTime = Date.now() / 1000;
                    console.log('[LOGIN] Token details:', {
                        issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'Unknown',
                        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Never',
                        timeUntilExpiry: payload.exp ? Math.round((payload.exp - currentTime) / 60) + ' minutes' : 'Never',
                        currentTime: new Date(currentTime * 1000).toISOString()
                    });
                } catch (decodeError) {
                    console.error('[LOGIN] Error decoding token:', decodeError);
                }
                
                // Show success popup and wait for user to click OK before navigating
                const handleLoginSuccess = () => {
                    if (result.is_admin) {
                        navigate('/dashboard');
                    } else if (result.role === 'society') {
                        // Always check profile completeness for society users
                        console.log('Society user login - profile complete:', result.profile_complete);
                        
                        if (result.profile_complete === false || 
                            result.profile_exists === false || 
                            (result.missing_fields && result.missing_fields.length > 0)) {
                            // Profile is incomplete - redirect to profile setup
                            console.log('Redirecting to profile setup due to incomplete profile');
                            navigate('/society-profile-setup');
                        } else {
                            // Profile is complete - go to dashboard
                            console.log('Profile is complete - redirecting to dashboard');
                            navigate('/subadmin');
                        }
                    } else {
                        navigate('/userprofile');
                    }
                };
                
                showPopup(
                    'Login Successful!',
                    'Welcome back! Click OK to continue to your dashboard.',
                    'success',
                    handleLoginSuccess
                );
                
            } else {
                console.log('[LOGIN] Login failed:', result);
                
                // Handle specific error types for society users
                if (result.error === 'registration_pending') {
                    showPopup(
                        'Registration Pending',
                        'Your society registration request is still being processed. Please wait for admin approval before you can access your dashboard. You will get access to the portal once approved.',
                        'warning'
                    );
                } else if (result.error === 'registration_rejected') {
                    showPopup(
                        'Registration Rejected',
                        'Unfortunately, your society registration request has been rejected by the administrator. Please contact support at admin@nextgenarchitect.com for queries.',
                        'error'
                    );
                } else if (result.error === 'registration_invalid') {
                    showPopup(
                        'Registration Status Issue', 
                        'There appears to be an issue with your registration status in our system. Please contact the administrator at admin@nextgenarchitect.com for immediate assistance.',
                        'error'
                    );
                } else if (result.error === 'Invalid password') {
                    setLoginError('Invalid email or password. Please try again.');
                } else if (result.error === 'User not found') {
                    setLoginError('No account found with this email address.');
                } else {
                    // Generic error - could be from status messages or other errors
                    setLoginError(result.error || result.message || 'Login failed. Please check your credentials.');
                }
            }
        } catch (error) {
            setLoginError('An error occurred. Please try again.',error);
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
                        <input type="text" name="name" value={signupForm.name} onChange={handleSignupInput} placeholder="Name" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400' />
                    )}
                    <input
                        type="email"
                        name="email"
                        value={isLoginMode ? loginForm.email : signupForm.email}
                        onChange={isLoginMode ? handleLoginInput : handleSignupInput}
                        placeholder="Email Address"
                        required
                        className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'
                    />
                    <input
                        type="password"
                        name="password"
                        value={isLoginMode ? loginForm.password : signupForm.password}
                        onChange={isLoginMode ? handleLoginInput : handleSignupInput}
                        placeholder="Password"
                        required
                        className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'
                    />
                    {!isLoginMode && (
                        <input type="password" name="confirmPassword" value={signupForm.confirmPassword} onChange={handleSignupInput} placeholder="Confirm Password" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'/>
                    )}
                    {signupError && !isLoginMode && (
                        <div className="text-red-600 text-sm font-semibold text-center">{signupError}</div>
                    )}
                    {loginError && isLoginMode && (
                        <div className="text-red-600 text-sm font-semibold text-center">{loginError}</div>
                    )}
                    {isLoginMode && (
                        <div className='text-right'>
                            <p className='text-[#ED7600] hover:underline cursor-pointer'>Forgot Password?</p>
                        </div>
                    )}
                    <button className='w-full p-3 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-full text-lg font-bold hover:opacity-90 transition shadow-lg'>
                        {isLoginMode ? "Login" : "Sign Up"}
                    </button>

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
        </div>
    );
};

export default Login;