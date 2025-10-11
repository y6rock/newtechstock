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
                className="form-input"
              />
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
                className="form-input"
              />
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
              className="form-input"
            />
          </div>

          <div className="form-group">
            <FaPhone className="form-icon" />
            <input
              type="text"
              name="phone"
              placeholder="Phone number"
              value={form.phone}
              onChange={handleChange}
              required
              className="form-input"
            />
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
              className="form-input"
            />
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
              className="form-input"
            />
            <span 
              onClick={() => setShowPassword(!showPassword)} 
              className="password-toggle"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
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
              className="form-input"
            />
            <span 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
              className="password-toggle"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
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
