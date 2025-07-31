import React, { useState } from 'react';
import Logo from '../../assets/Logo.png';

const Login = () => {
    const [isLoginMode, setIsLoginMode] = useState(false);

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
            <form className='space-y-4'>
                {!isLoginMode && (
                    <input type="text" placeholder="Name" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400' />
                )}

                <input type="email" placeholder="Email Address" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'/>
                <input type="password" placeholder="Password" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'/>

                {!isLoginMode && (
                    <input type="password" placeholder="Confirm Password" required className='w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400'/>
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
            </div>
        </div>
    );
};

export default Login;