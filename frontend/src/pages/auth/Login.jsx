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

    // Popup modal state
    const [popup, setPopup] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
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
            try {
                const emailCheck = await checkEmail(signupForm.email);

                if (emailCheck.exists) {
                    setSignupError('Email already exists. Please use a different email address.');
                    return;
                }

                navigate('/registration-form', {
                    state: {
                        userEmail: signupForm.email,
                        userName: signupForm.name,
                        userPassword: signupForm.password
                    }
                });
            } catch (error) {
                setSignupError('Failed to verify email. Please try again.');
            }
        } else {
            const result = await signupUser({
                username: signupForm.name,
                email: signupForm.email,
                password: signupForm.password,
                role: 'user'
            });
            if (result.user_id) {
                alert('Signup successful as user! Please login.');
                setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
                setSignupError('');
                setIsLoginMode(true);
            } else {
                setSignupError(result.error || 'Signup failed');
            }
        }
    };

    // Show popup modal
    const showPopup = (title, message, type = 'info') => {
        setPopup({
            isOpen: true,
            title,
            message,
            type
        });
    };

    const closePopup = () => {
        setPopup({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
        });
    };

    // Login submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');

        try {
            const result = await loginUser({
                email: loginForm.email,
                password: loginForm.password
            });

            if (result.success && result.access_token) {
                localStorage.setItem('token', result.access_token);

                // Decode JWT to check role
                let payload = {};
                try {
                    payload = JSON.parse(atob(result.access_token.split('.')[1]));
                } catch (decodeError) {
                    console.error('[LOGIN] Error decoding token:', decodeError);
                }

                showPopup(
                    'Login Successful!',
                    'Welcome back! Redirecting...',
                    'success'
                );

                setTimeout(() => {
                    closePopup();
                    if (result.is_admin || payload.role === 'admin') {
                        navigate('/dashboard'); // ✅ fixed path
                    } else if (result.role === 'society') {
                        if (
                            result.profile_complete === false ||
                            result.profile_exists === false ||
                            (result.missing_fields && result.missing_fields.length > 0)
                        ) {
                            navigate('/society-profile-setup');
                        } else {
                            navigate('/subadmin');
                        }
                    } else {
                        navigate('/userprofile');
                    }
                }, 2000);
            } else if (result.error) {
                if (result.error === 'registration_pending') {
                    showPopup(
                        'Registration Pending',
                        'Your society registration request is still being processed. Please wait for admin approval.',
                        'warning'
                    );
                } else if (result.error === 'registration_rejected') {
                    showPopup(
                        'Registration Rejected',
                        'Your society registration request has been rejected.',
                        'error'
                    );
                } else {
                    setLoginError(result.error || 'Login failed. Please check your credentials.');
                }
            }
        } catch (error) {
            setLoginError('An error occurred. Please try again.');
        }
    };

    // Toggle Login/Signup mode
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
            <div className="w-[500px] bg-white p-8 rounded-2xl shadow-lg">
                {/* Logo */}
                <div className="flex flex-col items-center mb-6 space-y-3">
                    <div className="w-32 h-32">
                        <img src={Logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#2F3D57] tracking-wide">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2F3D57] to-[#ED7600]">
                            NextGenArchitect
                        </span>
                    </h1>
                </div>

                {/* Toggle */}
                <div className="relative flex h-12 mb-6 border border-gray-300 rounded-full overflow-hidden">
                    <button
                        onClick={() => setIsLoginMode(true)}
                        className={`w-1/2 text-lg font-medium transition-all z-10 ${isLoginMode ? 'text-white' : 'text-[#2F3D57]'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLoginMode(false)}
                        className={`w-1/2 text-lg font-medium transition-all z-10 ${!isLoginMode ? 'text-white' : 'text-[#2F3D57]'}`}
                    >
                        Sign Up
                    </button>
                    <div
                        className={`absolute top-0 h-full w-1/2 rounded-full bg-gradient-to-r from-[#2F3D57] to-[#ED7600] ${
                            isLoginMode ? 'left-0' : 'left-1/2'
                        } transition-all duration-300`}
                    ></div>
                </div>

                {/* Form */}
                <form className="space-y-4" onSubmit={isLoginMode ? handleLoginSubmit : handleSignupSubmit}>
                    {!isLoginMode && (
                        <input type="text" name="name" value={signupForm.name} onChange={handleSignupInput} placeholder="Name" required className="w-full p-3 border-b-2 border-gray-300 outline-none" />
                    )}
                    <input
                        type="email"
                        name="email"
                        value={isLoginMode ? loginForm.email : signupForm.email}
                        onChange={isLoginMode ? handleLoginInput : handleSignupInput}
                        placeholder="Email Address"
                        required
                        className="w-full p-3 border-b-2 border-gray-300 outline-none"
                    />
                    <input
                        type="password"
                        name="password"
                        value={isLoginMode ? loginForm.password : signupForm.password}
                        onChange={isLoginMode ? handleLoginInput : handleSignupInput}
                        placeholder="Password"
                        required
                        className="w-full p-3 border-b-2 border-gray-300 outline-none"
                    />
                    {!isLoginMode && (
                        <input type="password" name="confirmPassword" value={signupForm.confirmPassword} onChange={handleSignupInput} placeholder="Confirm Password" required className="w-full p-3 border-b-2 border-gray-300 outline-none"/>
                    )}
                    {signupError && !isLoginMode && <div className="text-red-600 text-sm text-center">{signupError}</div>}
                    {loginError && isLoginMode && <div className="text-red-600 text-sm text-center">{loginError}</div>}
                    
                    <button className="w-full p-3 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-full text-lg font-bold">
                        {isLoginMode ? 'Login' : 'Sign Up'}
                    </button>
                </form>
            </div>

            {/* Popup Modal */}
            <PopupModal isOpen={popup.isOpen} onClose={closePopup} title={popup.title} message={popup.message} type={popup.type} />
        </div>
    );
};

export default Login;
