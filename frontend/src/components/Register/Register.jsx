import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaCity, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Register.css';

function Register() {
  const [form, setForm] = useState({
    name: '',
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

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage(''); // Clear previous messages

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    try {
      const res = await axios.post('/api/register', {
        name: form.name,
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
    <div className="register-container">
        <div className="register-form-wrapper">
            <div className="register-header">
                <h2 className="register-title">Create account</h2>
                <p className="register-subtitle">Enter your information to create your account</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
                <div className="form-fields-row">
                    <div className="form-field">
                        <FaUser className="form-icon" />
                        <input
                            type="text"
                            name="name"
                            placeholder="First name"
                            value={form.name}
                            onChange={handleChange}
                            className="form-input"
                            required
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
                            className="form-input"
                            required
                        />
                    </div>
                </div>

                <div className="form-field-single">
                    <FaEnvelope className="form-icon" />
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-field-single">
                    <FaPhone className="form-icon" />
                    <input
                        type="text"
                        name="phone"
                        placeholder="Phone number"
                        value={form.phone}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-field-single">
                    <FaCity className="form-icon" />
                    <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={form.city}
                        onChange={handleChange}
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-field-single">
                    <FaLock className="form-icon" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="off"
                        className="form-input"
                        required
                    />
                    <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>

                <div className="form-field-single extra-margin">
                    <FaLock className="form-icon" />
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        autoComplete="off"
                        className="form-input"
                        required
                    />
                    <span
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle"
                    >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>

                {message && (
                    <p className={`status-message ${
                        message.includes('match') || message.includes('failed') ? 'status-error' : 'status-success'
                    }`}>
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    className="submit-button"
                >
                    Create account
                </button>
            </form>

            <div className="login-link">
                Already have an account? <Link to="/login">Sign in</Link>
            </div>
        </div>
    </div>
  );
}

export default Register;