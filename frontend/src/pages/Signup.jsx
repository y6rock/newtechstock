import React from 'react';

export default function Signup() {
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center' }}>Sign Up</h2>
      <input placeholder="Name" style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
      <input placeholder="Email" style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
      <input type="password" placeholder="Password" style={{ width: '100%', padding: '10px', margin: '10px 0' }} />
      <button style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: '#fff' }}>Register</button>
    </div>
  );
}