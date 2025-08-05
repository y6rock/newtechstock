import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import './AuthForm.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`/api/auth/reset-password/${token}`, {
        password: password,
      });
      setMessage(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h2>Reset Your Password</h2>
        <p className="auth-form-subtitle">Enter your new password to complete the reset process</p>
        
        {!token ? (
          <div className="auth-message error">
            Invalid password reset link. Please request a new one.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {error && <p className="auth-message error">{error}</p>}
            {message && <p className="auth-message success">{message}</p>}

            <div className="auth-input-group">
              <FaLock className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
              {showPassword ? (
                <FaEyeSlash 
                  className="auth-password-toggle-icon"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <FaEye 
                  className="auth-password-toggle-icon"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>

            <div className="auth-input-group">
              <FaLock className="auth-input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input"
              />
              {showConfirmPassword ? (
                <FaEyeSlash 
                  className="auth-password-toggle-icon"
                  onClick={() => setShowConfirmPassword(false)}
                />
              ) : (
                <FaEye 
                  className="auth-password-toggle-icon"
                  onClick={() => setShowConfirmPassword(true)}
                />
              )}
            </div>

            <button 
              type="submit" 
              className="auth-submit-button" 
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-redirect-link">
          Remember your password? <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 