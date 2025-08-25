import React from 'react';

const Footer = () => {
  const handleSocialClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
        <div style={{ flex: '1 1 200px' }}>
          <h3 style={{ color: 'white', marginBottom: '15px' }}>Follow Us</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => handleSocialClick('https://www.facebook.com/GadgetShop.co.il')}
              style={{ 
                color: '#adb5bd', 
                textDecoration: 'none', 
                fontSize: '1.5em', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1877f2';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#adb5bd';
              }}
              title="Follow us on Facebook"
            >
              f
            </button>
            
            <button 
              onClick={() => handleSocialClick('https://www.instagram.com/gadgetshop.co.il/?hl=en')}
              style={{ 
                color: '#adb5bd', 
                textDecoration: 'none', 
                fontSize: '1.5em', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e4405f';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#adb5bd';
              }}
              title="Follow us on Instagram"
            >
              📷
            </button>
            
            <button 
              onClick={() => handleSocialClick('https://x.com/thegadgetshopsa?lang=en')}
              style={{ 
                color: '#adb5bd', 
                textDecoration: 'none', 
                fontSize: '1.5em', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#000000';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#adb5bd';
              }}
              title="Follow us on X (Twitter)"
            >
              𝕏
            </button>
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
        © {new Date().getFullYear()} TechStock. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer; 