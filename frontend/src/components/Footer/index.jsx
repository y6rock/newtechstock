import React from 'react';
import './Footer.css';

const Footer = () => {
  const handleSocialClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* TechStore Info */}
        <div className="footer-section">
          <h3 className="footer-title">TechStock</h3>
          <p className="footer-text">Your one-stop shop for premium tech products and cutting-edge electronics. Quality guaranteed.</p>
        </div>

        {/* Contact Us */}
        <div className="footer-section contact">
          <h3 className="footer-title">Contact Us</h3>
          <p className="footer-text">Email: support@techstock.com</p>
          <p className="footer-text">Phone: (555) 123-4567</p>
          <p className="footer-text">Address: 123 Tech Street</p>
          <p className="footer-text">Hours: (555) 456-7891</p>
        </div>

        {/* Follow Us */}
        <div className="footer-section social">
          <h3 className="footer-title">Follow Us</h3>
          <div className="social-buttons">
            <button 
              onClick={() => handleSocialClick('https://www.facebook.com/GadgetShop.co.il')}
              className="social-button facebook"
              title="Follow us on Facebook"
            >
              f
            </button>
            
            <button 
              onClick={() => handleSocialClick('https://www.instagram.com/gadgetshop.co.il/?hl=en')}
              className="social-button instagram"
              title="Follow us on Instagram"
            >
              📷
            </button>
            
            <button 
              onClick={() => handleSocialClick('https://x.com/thegadgetshopsa?lang=en')}
              className="social-button twitter"
              title="Follow us on X (Twitter)"
            >
              𝕏
            </button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} TechStock. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer; 