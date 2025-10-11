import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaCity, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Signup.css';

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
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
      case 'lastName':
        if (!value.trim()) return `${name === 'name' ? 'First' : 'Last'} name is required`;
        if (value.length > 35) return `${name === 'name' ? 'First' : 'Last'} name must be 35 characters or less`;
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        const phoneDigits = value.replace(/\D/g, '');
        
        // Check if phone has valid length
        if (phoneDigits.length < 7 || phoneDigits.length > 15) {
          return 'Phone number must be between 7 and 15 digits. Examples: +1234567890, (123) 456-7890';
        }
        
        // Check for common invalid patterns
        if (phoneDigits.length === phoneDigits.split('').filter(d => d === phoneDigits[0]).length) {
          return 'Phone number cannot be all the same digit';
        }
        
        // Check for sequential numbers (like 1234567890)
        const isSequential = phoneDigits.split('').every((digit, index) => {
          if (index === 0) return true;
          const currentDigit = parseInt(digit);
          const prevDigit = parseInt(phoneDigits[index - 1]);
          return currentDigit === (prevDigit + 1) % 10; // Handle wrap-around (9 -> 0)
        });
        
        if (isSequential && phoneDigits.length >= 8) {
          return 'Phone number cannot be sequential numbers';
        }
        
        return '';
      case 'city':
        if (!value.trim()) return 'City is required';
        if (value.length > 100) return 'City must be 100 characters or less';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters long';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== form.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  // Phone formatting function
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format based on length
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    } else {
      return `+${phoneNumber.slice(0, phoneNumber.length - 10)} (${phoneNumber.slice(-10, -7)}) ${phoneNumber.slice(-7, -4)}-${phoneNumber.slice(-4)}`;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format phone number as user types
    let formattedValue = value;
    if (name === 'phone') {
      formattedValue = formatPhoneNumber(value);
    }
    
    setForm({ ...form, [name]: formattedValue });
    
    // Validate the field
    const error = validateField(name, formattedValue);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
    
    // Special case for password confirmation
    if (name === 'password') {
      const confirmError = validateField('confirmPassword', form.confirmPassword);
      setValidationErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validate all fields
    const errors = {};
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
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
    <div className="signup-container">
      <div className="signup-form-wrapper">
        <div className="signup-header">
          <h1 className="signup-title">Create Account</h1>
          <p className="signup-subtitle">Fill in your details to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {message && (
            <p className={message.includes('failed') || message.includes('match') ? 'error-message' : 'success-message'}>
              {message}
            </p>
          )}

          <div className="form-group row">
            <div className="form-field">
              <FaUser className="form-icon" />
              <input
                type="text"
                name="name"
                placeholder="First name"
                value={form.name}
                onChange={handleChange}
                required
                className={`form-input ${validationErrors.name ? 'error' : ''}`}
              />
              {validationErrors.name && <span className="field-error">{validationErrors.name}</span>}
            </div>
            <div className="form-field">
              <FaUser className="form-icon" />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={form.lastName}
                onChange={handleChange}
                required
                className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
              />
              {validationErrors.lastName && <span className="field-error">{validationErrors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <FaEnvelope className="form-icon" />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
            />
            {validationErrors.email && <span className="field-error">{validationErrors.email}</span>}
          </div>

          <div className="form-group">
            <FaPhone className="form-icon" />
            <input
              type="tel"
              name="phone"
              placeholder="(123) 456-7890"
              value={form.phone}
              onChange={handleChange}
              required
              className={`form-input ${validationErrors.phone ? 'error' : ''}`}
            />
            {validationErrors.phone && <span className="field-error">{validationErrors.phone}</span>}
          </div>

          <div className="form-group">
            <FaCity className="form-icon" />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
              className={`form-input ${validationErrors.city ? 'error' : ''}`}
            />
            {validationErrors.city && <span className="field-error">{validationErrors.city}</span>}
          </div>

          <div className="form-group">
            <FaLock className="form-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
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

          <div className="form-group">
            <FaLock className="form-icon" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="off"
              required
              className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
            />
            <span 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
              className="password-toggle"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
            {validationErrors.confirmPassword && <span className="field-error">{validationErrors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="submit-button"
          >
            Create Account
          </button>
        </form>

        <div className="login-link">
          <Link to="/login" className="login-link-text">
            Already have an account? Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
