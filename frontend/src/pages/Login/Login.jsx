import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { reEvaluateToken } = useSettings();

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const error = validateEmail(value);
    setValidationErrors(prev => ({ ...prev, email: error }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    const error = validatePassword(value);
    setValidationErrors(prev => ({ ...prev, password: error }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setRemainingAttempts(null);
    setRemainingTime(null);
    setIsSubmitting(true);

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setValidationErrors({ email: emailError, password: passwordError });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        console.log("Login.jsx: Token stored. Calling reEvaluateToken and navigating.");
        
        if (data.user && data.user.role === 'admin') {
            navigate('/manager/dashboard');
        } else {
            navigate('/');
        }
        
        reEvaluateToken();

      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
        
        // Handle remaining attempts
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        
        // Handle remaining time for blocked users
        if (data.remainingTime !== undefined) {
          setRemainingTime(data.remainingTime);
          // Start countdown timer
          const timer = setInterval(() => {
            setRemainingTime(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Login.jsx: A network or server error occurred:", err);
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="login-header">
          <h2 className="login-title">Sign in</h2>
          <p className="login-subtitle">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <p className="error-message">{error}</p>}
          {remainingAttempts !== null && remainingAttempts > 0 && (
            <p className="warning-message">
              Remaining login attempts: {remainingAttempts}
            </p>
          )}
          {remainingTime !== null && remainingTime > 0 && (
            <p className="error-message">
              Account temporarily locked. Please wait {remainingTime} seconds before trying again.
            </p>
          )}
          
          <div className="form-group">
            <FaEnvelope className="form-icon" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              required
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
            />
            {validationErrors.email && <span className="field-error">{validationErrors.email}</span>}
          </div>

          <div className="form-group">
            <FaLock className="form-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="off"
              required
              className={`form-input ${validationErrors.password ? 'error' : ''}`}
            />
            <span 
              onClick={() => setShowPassword(!showPassword)} 
              className="password-toggle"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
            {validationErrors.password && <span className="field-error">{validationErrors.password}</span>}
          </div>

          <div className="forgot-password-link">
            <Link to="/forgot-password">
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (remainingTime !== null && remainingTime > 0)}
            className="submit-button"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="signup-link">
          <Link to="/signup">
            Don't have an account? Sign up →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
