import React, { useState } from 'react';

const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('email'); // 'email', 'otp', or 'reset'
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Email is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { sendPasswordResetOTP } = await import('../../services/apiService');
            const result = await sendPasswordResetOTP(email);
            
            if (result.success) {
                setStep('otp');
                startResendTimer();
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerification = async (e) => {
        e.preventDefault();
        
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { verifyPasswordResetOTP } = await import('../../services/apiService');
            const result = await verifyPasswordResetOTP(email, otp);
            
            if (result.success) {
                setStep('reset');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0) return;

        setIsLoading(true);
        setError('');

        try {
            const { sendPasswordResetOTP } = await import('../../services/apiService');
            const result = await sendPasswordResetOTP(email);
            
            if (result.success) {
                startResendTimer();
                setError('');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const startResendTimer = () => {
        setResendTimer(60);
        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        
        if (!newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { resetPasswordWithOTP } = await import('../../services/apiService');
            const result = await resetPasswordWithOTP(email, otp, newPassword);
            
            if (result.success) {
                onSuccess('Password reset successfully! You can now login with your new password.');
                handleClose();
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setError('');
        setStep('email');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setResendTimer(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#2F3D57]">
                        {step === 'email' ? 'Forgot Password' : step === 'otp' ? 'Verify OTP' : 'Reset Password'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-[#ED7600] text-2xl font-bold"
                    >
                        Ã—
                    </button>
                </div>

                {step === 'email' ? (
                    /* Email Step */
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div>
                            <p className="text-gray-600 mb-4">
                                Enter your email address and we'll send you a 6-digit OTP to reset your password.
                            </p>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full p-3 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-full text-lg font-bold hover:opacity-90 transition shadow-lg disabled:opacity-50"
                        >
                            {isLoading ? 'Sending OTP...' : 'Send OTP'}
                        </button>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full p-3 text-gray-600 hover:text-[#2F3D57] transition"
                        >
                            Back to Login
                        </button>
                    </form>
                ) : step === 'otp' ? (
                    /* OTP Verification Step */
                    <form onSubmit={handleOtpVerification} className="space-y-4">
                        <div>
                            <p className="text-gray-600 mb-4">
                                We've sent a 6-digit OTP to <strong>{email}</strong>. Please enter it below.
                            </p>
                            
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/https://nextgen-ta95.onrender.com/apiD/g, '').slice(0, 6);
                                    setOtp(value);
                                }}
                                placeholder="Enter 6-digit OTP"
                                className="w-full p-3 text-center text-2xl tracking-widest border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400"
                                disabled={isLoading}
                                maxLength={6}
                                required
                            />
                            
                            <div className="mt-4 text-center">
                                {resendTimer > 0 ? (
                                    <p className="text-gray-500 text-sm">
                                        Resend OTP in {resendTimer}s
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={isLoading}
                                        className="text-[#ED7600] hover:text-[#2F3D57] font-semibold text-sm transition disabled:opacity-50"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full p-3 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-full text-lg font-bold hover:opacity-90 transition shadow-lg disabled:opacity-50"
                        >
                            {isLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setStep('email');
                                setOtp('');
                                setResendTimer(0);
                            }}
                            className="w-full p-3 text-gray-600 hover:text-[#2F3D57] transition"
                        >
                            Change Email
                        </button>
                    </form>
                ) : (
                    /* Reset Password Step */
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div>
                            <p className="text-gray-600 mb-4">
                                Enter your new password below.
                            </p>
                            
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password"
                                className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400 mb-3"
                                disabled={isLoading}
                                required
                            />
                            
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm text-center">{error}</div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full p-3 bg-gradient-to-r from-[#2F3D57] to-[#ED7600] text-white rounded-full text-lg font-bold hover:opacity-90 transition shadow-lg disabled:opacity-50"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setStep('otp');
                                setNewPassword('');
                                setConfirmPassword('');
                            }}
                            className="w-full p-3 text-gray-600 hover:text-[#2F3D57] transition"
                        >
                            Back to OTP
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
