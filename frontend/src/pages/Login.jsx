import React from 'react';

export default function Login() {
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center' }}>Login</h2>
      <input placeholder="Email" style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
      <input type="password" placeholder="Password" style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
      <button style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff' }}>Login</button>
    </div>
  );
}