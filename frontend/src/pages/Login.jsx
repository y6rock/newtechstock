import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'; // Import icons

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    try {
      const res = await axios.post('/api/login', form);
      localStorage.setItem('token', res.data.token);
      
      // Dispatch a storage event to notify other components
      window.dispatchEvent(new Event('storage'));

      setMessage(res.data.message);
      navigate('/manager/dashboard'); // ✅ ניתוב אוטומטי לדשבורד
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
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
            }}>Enter your email and password to access your account</p>

            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
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
                            width: 'calc(100% - 30px)', // Adjust for padding and icon
                            padding: '12px 15px 12px 45px', // Left padding for icon
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

                <div style={{ marginBottom: '10px', position: 'relative' }}>
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
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={handleChange}
                        style={{
                            width: 'calc(100% - 30px)', // Adjust for padding and icon
                            padding: '12px 15px 12px 45px', // Left padding for icon
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

                <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                    <Link to="/forgot-password" style={{
                        color: '#007bff',
                        textDecoration: 'none',
                        fontSize: '0.9em',
                        transition: 'color 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.color = '#0056b3'}
                    onMouseOut={(e) => e.target.style.color = '#007bff'}
                    >
                        Forgot your password?
                    </Link>
                </div>

                {message && <p style={{ color: message.includes('failed') ? 'red' : 'green', marginBottom: '15px' }}>{message}</p>}

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
                    Sign in
                </button>
            </form>

            <div style={{ marginTop: '25px', fontSize: '0.95em', color: '#666' }}>
                Don't have an account? <Link to="/register" style={{
                    color: '#007bff',
                    textDecoration: 'none',
                    transition: 'color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.color = '#0056b3'}
                onMouseOut={(e) => e.target.style.color = '#007bff'}
                >Sign up</Link>
            </div>
        </div>
    </div>
  );
}

export default Login;
