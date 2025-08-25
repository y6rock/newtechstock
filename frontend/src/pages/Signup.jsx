// src/pages/Signup.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCity, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaShieldAlt,
  FaRocket,
  FaStar,
  FaGift,
  FaCheckCircle,
  FaHandshake,
  FaCreditCard
} from 'react-icons/fa';
import './AuthForm.css'; // Import the new shared CSS

function Signup() {
  const [form, setForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validate that all fields are filled
    if (!form.name.trim() || !form.lastName.trim() || !form.email.trim() || 
        !form.phone.trim() || !form.city.trim() || !form.password.trim() || 
        !form.confirmPassword.trim()) {
      setMessage('All fields are required!');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMessage('Please enter a valid email address!');
      return;
    }

    // Validate password length
    if (form.password.length < 6) {
      setMessage('Password must be at least 6 characters long!');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    try {
      const res = await axios.post('/api/auth/register', {
        name: form.name + ' ' + form.lastName,
        email: form.email,
        phone: form.phone,
        city: form.city,
        password: form.password,
      });
      setMessage(res.data.message);
      navigate('/login');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
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
            <FaHandshake style={{ fontSize: '35px', color: 'white' }} />
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
            Join TechStock!
          </h2>
          
          <p style={{
            color: '#7f8c8d',
            fontSize: '16px',
            margin: '0',
            lineHeight: '1.6'
          }}>
            Create your account and unlock exclusive benefits
          </p>
        </div>

        {/* Benefits Preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
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
            <FaCreditCard style={{ color: '#3498db', fontSize: '20px', marginBottom: '5px' }} />
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Secure</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {message && (
            <div style={{
              background: message.includes('failed') || message.includes('match') 
                ? 'linear-gradient(135deg, #ff6b6b, #ee5a52)' 
                : 'linear-gradient(135deg, #27ae60, #2ecc71)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: message.includes('failed') || message.includes('match')
                ? '0 5px 15px rgba(255, 107, 107, 0.3)'
                : '0 5px 15px rgba(39, 174, 96, 0.3)'
            }}>
              <FaCheckCircle />
              {message}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{ position: 'relative' }}>
              <FaUser style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#667eea',
                fontSize: '18px'
              }} />
              <input
                type="text"
                name="name"
                placeholder="First name"
                value={form.name}
                onChange={handleChange}
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
            <div style={{ position: 'relative' }}>
              <FaUser style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#667eea',
                fontSize: '18px'
              }} />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={form.lastName}
                onChange={handleChange}
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
          </div>

          <div style={{ position: 'relative', marginBottom: '20px' }}>
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
              name="email"
              placeholder="Enter your email address"
              value={form.email}
              onChange={handleChange}
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

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <FaPhone style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667eea',
              fontSize: '18px'
            }} />
            <input
              type="text"
              name="phone"
              placeholder="Phone number"
              value={form.phone}
              onChange={handleChange}
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

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <FaCity style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667eea',
              fontSize: '18px'
            }} />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
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

          <div style={{ position: 'relative', marginBottom: '20px' }}>
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
              name="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
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

          <div style={{ position: 'relative', marginBottom: '25px' }}>
            <FaLock style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#667eea',
              fontSize: '18px'
            }} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
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
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
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
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button 
            type="submit" 
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <FaRocket />
              Create Account
            </div>
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
            Already have an account?
          </p>
          <Link to="/login" style={{
            color: '#667eea',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#764ba2'}
          onMouseLeave={(e) => e.target.style.color = '#667eea'}
          >
            Sign in to your account →
          </Link>
        </div>

        {/* Security & Benefits Note */}
        <div style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '15px',
            background: 'rgba(46, 204, 113, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(46, 204, 113, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#27ae60', fontSize: '14px' }}>
              <FaShieldAlt />
              Bank-level security
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '15px',
            background: 'rgba(155, 89, 182, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(155, 89, 182, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#8e44ad', fontSize: '14px' }}>
              <FaGift />
              Free rewards
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
