import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { reEvaluateToken } = useSettings();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setRemainingAttempts(null);
    setRemainingTime(null);
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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '1.8em',
          marginBottom: '10px',
          color: '#333'
        }}>Sign in</h2>
        <p style={{
          color: '#666',
          marginBottom: '30px',
          fontSize: '0.95em'
        }}>Enter your credentials to access your account</p>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          {error && <p style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
          {remainingAttempts !== null && remainingAttempts > 0 && (
            <p style={{ color: 'orange', marginBottom: '15px', textAlign: 'center' }}>
              Remaining login attempts: {remainingAttempts}
            </p>
          )}
          {remainingTime !== null && remainingTime > 0 && (
            <p style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
              Account temporarily locked. Please wait {remainingTime} seconds before trying again.
            </p>
          )}
          
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <FaEnvelope style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#aaa'
            }} />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: 'calc(100% - 30px)',
                padding: '12px 15px 12px 45px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1em',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <FaLock style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#aaa'
            }} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              required
              style={{
                width: '100%',
                padding: '12px 45px 12px 45px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1em',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <span 
              onClick={() => setShowPassword(!showPassword)} 
              style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: '#aaa',
                padding: '5px'
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link to="/forgot-password" style={{
              color: '#007bff',
              textDecoration: 'none',
              fontSize: '0.95em',
              transition: 'color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.color = '#0056b3'}
            onMouseOut={(e) => e.target.style.color = '#007bff'}
            >
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (remainingTime !== null && remainingTime > 0)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1.1em',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '25px' }}>
          <Link to="/signup" style={{
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '0.95em',
            transition: 'color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.color = '#0056b3'}
          onMouseOut={(e) => e.target.style.color = '#007bff'}
          >
            Don't have an account? Sign up →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
