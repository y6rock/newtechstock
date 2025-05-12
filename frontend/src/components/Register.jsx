import React, { useState } from 'react';
import axios from 'axios';

function Register() {
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '', city: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      //const res = await axios.post('http://localhost:3001/api/register', form);
      const res = await axios.post('http://localhost:3001/api/register', form);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error occurred');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
{Object.keys(form).map(key => (
  <React.Fragment key={key}>
    <input name={key} placeholder={key} onChange={handleChange} /><br />
  </React.Fragment>
))}

        <button type="submit">Register</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default Register;
