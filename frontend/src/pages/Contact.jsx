import React from 'react';

export default function Contact() {
  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h2>Contact Us</h2>
      <input placeholder="Your Name" style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
      <input placeholder="Email" style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
      <textarea placeholder="Message" rows="5" style={{ width: '100%', padding: '10px' }}></textarea>
      <button style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: '#fff' }}>Send</button>
    </div>
  );
}