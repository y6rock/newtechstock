import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#212529',
      color: '#adb5bd',
      padding: '40px 20px',
      marginTop: 'auto', // Pushes footer to the bottom
      borderTop: '1px solid #343a40',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: '30px',
      }}>
        {/* TechStore Info */}
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>TechStock</h3>
          <p>Your one-stop shop for premium tech products and cutting-edge electronics. Quality guaranteed.</p>
        </div>

        {/* Contact Us */}
        <div style={{ flex: '1 1 250px' }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>Contact Us</h3>
          <p>Email: support@techstock.com</p>
          <p>Phone: (555) 123-4567</p>
          <p>Address: 123 Tech Street</p>
          <p>Hours: (555) 456-7891</p>
        </div>

        {/* Follow Us */}
        <div style={{ flex: '1 1 150px' }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>Follow Us</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '1.5em', background: 'none', border: 'none', cursor: 'pointer' }}>f</button> {/* Placeholder for Facebook icon */}
            <button style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '1.5em', background: 'none', border: 'none', cursor: 'pointer' }}></button> {/* Placeholder for Twitter icon */}
            <button style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '1.5em', background: 'none', border: 'none', cursor: 'pointer' }}></button> {/* Placeholder for Instagram icon */}
          </div>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid #343a40',
        marginTop: '30px',
        paddingTop: '20px',
        textAlign: 'center',
        fontSize: '0.9em',
        color: '#6c757d',
      }}>
        © 2024 TechStock. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer; 