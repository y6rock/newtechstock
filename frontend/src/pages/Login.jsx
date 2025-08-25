import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaUser, 
  FaShieldAlt, 
  FaRocket,
  FaCheckCircle,
  FaStar,
  FaGift
} from 'react-icons/fa';
import './AuthForm.css';

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
    <div className="auth-container" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="auth-form-wrapper" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        maxWidth: '450px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Elements */}
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          background: 'linear-gradient(45deg, #ff6b6b, #ffa500)',
          borderRadius: '50%',
          opacity: '0.1'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(45deg, #4ecdc4, #44a08d)',
          borderRadius: '50%',
          opacity: '0.1'
        }}></div>

        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
          }}>
            <FaUser style={{ fontSize: '35px', color: 'white' }} />
          </div>
          
          <h2 style={{
            fontSize: '2.5em',
            fontWeight: '700',
            color: '#2c3e50',
            margin: '0 0 10px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Welcome Back!
          </h2>
          
          <p style={{
            color: '#7f8c8d',
            fontSize: '16px',
            margin: '0',
            lineHeight: '1.6'
          }}>
            Sign in to your TechStock account and explore amazing deals
          </p>
        </div>

        {/* Features Preview */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: '30px',
          padding: '20px',
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '15px',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <FaStar style={{ color: '#f39c12', fontSize: '20px', marginBottom: '5px' }} />
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Premium</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaGift style={{ color: '#e74c3c', fontSize: '20px', marginBottom: '5px' }} />
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Rewards</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <FaRocket style={{ color: '#3498db', fontSize: '20px', marginBottom: '5px' }} />
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Fast</div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="auth-form" noValidate>
          {error && (
            <div style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 5px 15px rgba(255, 107, 107, 0.3)'
            }}>
              <FaShieldAlt />
              {error}
            </div>
          )}
          
          {remainingAttempts !== null && remainingAttempts > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f39c12, #e67e22)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaShieldAlt />
              Remaining login attempts: {remainingAttempts}
            </div>
          )}
          
          {remainingTime !== null && remainingTime > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaShieldAlt />
              Account temporarily locked. Please wait {remainingTime} seconds before trying again.
            </div>
          )}
          
          <div className="auth-input-group" style={{
            position: 'relative',
            marginBottom: '20px'
          }}>
            <FaEnvelope style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667eea',
              fontSize: '18px'
            }} />
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '18px 20px 18px 50px',
                border: '2px solid #e1e8ed',
                borderRadius: '15px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e8ed';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div className="auth-input-group" style={{
            position: 'relative',
            marginBottom: '25px'
          }}>
            <FaLock style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667eea',
              fontSize: '18px'
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
                padding: '18px 20px 18px 50px',
                border: '2px solid #e1e8ed',
                borderRadius: '15px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                background: 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e8ed';
                e.target.style.boxShadow = 'none';
              }}
            />
            <span 
              onClick={() => setShowPassword(!showPassword)} 
              style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: '#667eea',
                fontSize: '18px',
                padding: '5px'
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div style={{
            textAlign: 'right',
            marginBottom: '25px'
          }}>
            <Link to="/forgot-password" style={{
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#764ba2'}
            onMouseLeave={(e) => e.target.style.color = '#667eea'}
            >
              Forgot your password?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || (remainingTime !== null && remainingTime > 0)}
            style={{
              width: '100%',
              padding: '18px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
            }}
          >
            {isSubmitting ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Signing In...
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <FaCheckCircle />
                Sign In
              </div>
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '15px',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <p style={{ margin: '0 0 10px', color: '#7f8c8d' }}>
            Don't have an account yet?
          </p>
          <Link to="/signup" style={{
            color: '#667eea',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#764ba2'}
          onMouseLeave={(e) => e.target.style.color = '#667eea'}
          >
            Create your free account →
          </Link>
        </div>

        {/* Security Note */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(46, 204, 113, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(46, 204, 113, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#27ae60', fontSize: '14px' }}>
            <FaShieldAlt />
            Your data is protected with bank-level security
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
