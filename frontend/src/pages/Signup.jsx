import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaCity, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

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
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '1.8em',
          marginBottom: '10px',
          color: '#333'
        }}>Create Account</h2>
        <p style={{
          color: '#666',
          marginBottom: '30px',
          fontSize: '0.95em'
        }}>Fill in your details to get started</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {message && (
            <p style={{ 
              color: message.includes('failed') || message.includes('match') ? 'red' : 'green', 
              marginBottom: '15px', 
              textAlign: 'center' 
            }}>
              {message}
            </p>
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
                color: '#aaa'
              }} />
              <input
                type="text"
                name="name"
                placeholder="First name"
                value={form.name}
                onChange={handleChange}
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
            <div style={{ position: 'relative' }}>
              <FaUser style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#aaa'
              }} />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={form.lastName}
                onChange={handleChange}
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
          </div>

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
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
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
            <FaPhone style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#aaa'
            }} />
            <input
              type="text"
              name="phone"
              placeholder="Phone number"
              value={form.phone}
              onChange={handleChange}
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
            <FaCity style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#aaa'
            }} />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
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
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
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

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <FaLock style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#aaa'
            }} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
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
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
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
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
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
            Create Account
          </button>
        </form>

        <div style={{ marginTop: '25px' }}>
          <Link to="/login" style={{
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '0.95em',
            transition: 'color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.color = '#0056b3'}
          onMouseOut={(e) => e.target.style.color = '#007bff'}
          >
            Already have an account? Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
