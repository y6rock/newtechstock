import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa'; // Assuming you have react-icons installed
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'If an account with that email exists, a password reset link has been sent.');
            } else {
                setError(data.message || 'Failed to send reset link. Please try again.');
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setError('An unexpected error occurred. Please try again later.');
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <h2 className="forgot-password-title">Forgot password?</h2>
                <p className="forgot-password-description">Enter your email address and we'll send you a link to reset your password</p>

                <form onSubmit={handleSubmit} className="forgot-password-form">
                    <div className="input-container">
                        <FaEnvelope className="input-icon" />
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="forgot-password-input"
                            required
                        />
                    </div>

                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    <button
                        type="submit"
                        className="forgot-password-button"
                    >
                        Send reset link
                    </button>
                </form>

                <div className="back-link-container">
                    <Link to="/login" className="back-link">
                        ← Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword; 