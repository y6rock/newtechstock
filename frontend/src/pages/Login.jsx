import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import './AuthForm.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { reEvaluateToken } = useSettings();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
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
        
        if (data.role === 'admin') {
            navigate('/manager/dashboard');
        } else {
            navigate('/profile');
        }
        
        reEvaluateToken();

      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error("Login.jsx: A network or server error occurred:", err);
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <h2>Login</h2>
        <p className="auth-form-subtitle">Enter your email and password to access your account</p>

        <form onSubmit={handleLogin} className="auth-form" noValidate>
          {error && <p className="auth-message error">{error}</p>}
          
          <div className="auth-input-group">
            <FaEnvelope className="auth-input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <FaLock className="auth-input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-links">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Logging In...' : 'Login'}
          </button>
        </form>

        <div className="auth-redirect-link">
          Don't have an account? <Link to="/signup">Create an Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
