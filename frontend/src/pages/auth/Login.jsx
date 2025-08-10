import React, { useState } from 'react';
import Logo from '../../assets/Logo.png';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(false);
    const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [signupError, setSignupError] = useState('');
    const [showSignupType, setShowSignupType] = useState(false);
    const navigate = useNavigate();

    const handleSignupInput = (e) => {
        setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
    };

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

    const handleSignupSubmit = (e) => {
        e.preventDefault();
        if (validateSignup()) {
            setShowSignupType(true);
        }
    };

    const handleSignupType = (type) => {
        setShowSignupType(false);
        if (type === 'society') {
            navigate('/registration-form');
        } else {
            alert('Signup successful as user!');
            setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
            setIsLoginMode(true);
        }
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
                <form className='space-y-4' onSubmit={isLoginMode ? undefined : handleSignupSubmit}>
                    {!isLoginMode && (
                        <input type="text" name="name" value={signupForm.name} onChange={handleSignupInput} placeholder="Name" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400' />
                    )}
                    <input type="email" name="email" value={signupForm.email} onChange={handleSignupInput} placeholder="Email Address" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'/>
                    <input type="password" name="password" value={signupForm.password} onChange={handleSignupInput} placeholder="Password" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'/>
                    {!isLoginMode && (
                        <input type="password" name="confirmPassword" value={signupForm.confirmPassword} onChange={handleSignupInput} placeholder="Confirm Password" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'/>
                    )}
                    {signupError && !isLoginMode && (
                        <div className="text-red-600 text-sm font-semibold text-center">{signupError}</div>
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
                            onClick={(e)=> { e.preventDefault(); setIsLoginMode(!isLoginMode) }} 
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
        </div>
    );
};

export default Login;