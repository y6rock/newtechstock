// src/pages/Signup.jsx
import React, { useState } from 'react';
import axios from 'axios';

function Signup() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    city: ''
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3001/api/register', form);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error occurred');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(form).map((key) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <input
              name={key}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              onChange={handleChange}
              value={form[key]}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        ))}
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Register</button>
      </form>
      {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}

export default Signup;
