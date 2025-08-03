// src/pages/Signup.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaCity, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
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
    <div className="auth-container">
        <div className="auth-form-wrapper">
            <h2>Create account</h2>
            <p className="auth-form-subtitle">Enter your information to create your account</p>

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="auth-flex-group">
                    <div className="auth-input-group">
                        <FaUser className="auth-input-icon" />
                        <input
                            type="text"
                            name="name"
                            placeholder="First name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="auth-input-group">
                        <FaUser className="auth-input-icon" />
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last name"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <FaEnvelope className="auth-input-icon" />
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="auth-input-group">
                    <FaPhone className="auth-input-icon" />
                    <input
                        type="text"
                        name="phone"
                        placeholder="Phone number"
                        value={form.phone}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="auth-input-group">
                    <FaCity className="auth-input-icon" />
                    <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={form.city}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="auth-input-group">
                    <FaLock className="auth-input-icon" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <span onClick={() => setShowPassword(!showPassword)} className="auth-password-toggle-icon">
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>

                <div className="auth-input-group">
                    <FaLock className="auth-input-icon" />
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="auth-password-toggle-icon">
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>

                {message && (
                    <p className={`auth-message ${message.includes('failed') || message.includes('match') ? 'error' : 'success'}`}>
                        {message}
                    </p>
                )}

                <button type="submit" className="auth-submit-button">Sign up</button>
            </form>

            <div className="auth-redirect-link">
                Already have an account? <Link to="/login">Sign in</Link>
            </div>
        </div>
    </div>
  );
}

export default Signup;
