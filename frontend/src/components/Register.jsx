import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaCity, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

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
            }}>Create account</h2>
            <p style={{
                color: '#666',
                marginBottom: '30px',
                fontSize: '0.95em'
            }}>Enter your information to create your account</p>

            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
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
                            required
                        />
                    </div>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <FaUser style={{
                            position: 'absolute',
                            left: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#aaa'
                        }} />
                        <input
                            type="text"
                            name="lastName" // Assuming there will be a lastName field later, for now using a placeholder
                            placeholder="Last name"
                            value={form.lastName}
                            onChange={handleChange}
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
                            required
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '20px', position: 'relative' }}>
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
                        required
                    />
                </div>

                <div style={{ marginBottom: '20px', position: 'relative' }}>
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
                        required
                    />
                </div>

                <div style={{ marginBottom: '20px', position: 'relative' }}>
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
                        required
                    />
                </div>

                <div style={{ marginBottom: '20px', position: 'relative' }}>
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
                        required
                    />
                    <span
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            color: '#aaa'
                        }}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>

                <div style={{ marginBottom: '30px', position: 'relative' }}>
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
                        placeholder="Confirm your password"
                        value={form.confirmPassword}
                        onChange={handleChange}
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
                        required
                    />
                    <span
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                            position: 'absolute',
                            right: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            color: '#aaa'
                        }}
                    >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>

                {message && <p style={{ color: message.includes('match') || message.includes('failed') ? 'red' : 'green', marginBottom: '15px' }}>{message}</p>}

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
                    Create account
                </button>
            </form>

            <div style={{ marginTop: '25px', fontSize: '0.95em', color: '#666' }}>
                Already have an account? <Link to="/login" style={{
                    color: '#007bff',
                    textDecoration: 'none',
                    transition: 'color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.color = '#0056b3'}
                onMouseOut={(e) => e.target.style.color = '#007bff'}
                >Sign in</Link>
            </div>
        </div>
    </div>
  );
}

export default Register;