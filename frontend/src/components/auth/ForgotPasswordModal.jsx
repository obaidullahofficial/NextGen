import React, { useState } from 'react';

const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('email'); // 'email' or 'reset'
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Email is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { forgotPassword } = await import('../../services/apiService');
            const result = await forgotPassword(email);
            
            if (result.success) {
                setStep('reset');
                // In development, we get the token back for testing
                if (result.debug_token) {
                    setResetToken(result.debug_token);
                }
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        
        if (!resetToken || !newPassword || !confirmPassword) {
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
            const { resetPassword } = await import('../../services/apiService');
            const result = await resetPassword(resetToken, newPassword);
            
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
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#2F3D57]">
                        {step === 'email' ? 'Forgot Password' : 'Reset Password'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-[#ED7600] text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {step === 'email' ? (
                    /* Email Step */
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div>
                            <p className="text-gray-600 mb-4">
                                Enter your email address and we'll send you a link to reset your password.
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
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full p-3 text-gray-600 hover:text-[#2F3D57] transition"
                        >
                            Back to Login
                        </button>
                    </form>
                ) : (
                    /* Reset Password Step */
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div>
                            <p className="text-gray-600 mb-4">
                                Enter the reset token and your new password.
                            </p>
                            
                            <input
                                type="text"
                                value={resetToken}
                                onChange={(e) => setResetToken(e.target.value)}
                                placeholder="Reset token"
                                className="w-full p-3 border-b-2 border-gray-300 outline-none focus:border-[#ED7600] placeholder-gray-400 mb-3"
                                disabled={isLoading}
                                required
                            />
                            
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
                            onClick={() => setStep('email')}
                            className="w-full p-3 text-gray-600 hover:text-[#2F3D57] transition"
                        >
                            Back to Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal;