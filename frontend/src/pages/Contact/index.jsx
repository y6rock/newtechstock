import React, { useState } from 'react';
import '../shared.css'; // Import shared styles
import './Contact.css';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Message sent successfully!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus(data.message || 'Failed to send message.');
      }
    } catch (err) {
      setStatus('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Blue Header - Now full width and with better contrast */}
      <div className="contact-header">
        <h1 className="contact-title">Contact Us</h1>
        <p className="contact-subtitle">
          Have questions about our products or services? Our team is here to help you.
        </p>
      </div>

      <div className="simple-page-container no-padding-top">
        <div className="contact-container">
          {/* Contact Information */}
          <div className="contact-info-card">
            <span className="contact-icon">📍</span>
            <h3 className="contact-info-title">Our Location</h3>
            <p className="contact-info-text">123 Tech Avenue<br />Silicon Valley, CA 94043<br />United States</p>
          </div>
          <div className="contact-info-card">
            <span className="contact-icon">📧</span>
            <h3 className="contact-info-title">Email Us</h3>
            <p className="contact-info-text">support@techstock.com<br />sales@techstock.com</p>
          </div>
          <div className="contact-info-card">
            <span className="contact-icon">📞</span>
            <h3 className="contact-info-title">Call Us</h3>
            <p className="contact-info-text">Customer Support: (220) 456-7890<br />Sales Inquiries: (712) 654-7891</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-container">
          <h2 className="contact-form-title">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Your Name</label>
              <input 
                type="text" 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input 
                type="email" 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="message" className="form-label">Message</label>
              <textarea 
                id="message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required 
                rows="5" 
                className="form-textarea"
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
            {status && (
              <p className={`status-message ${
                status.includes('successfully') ? 'status-success' : 
                status.includes('Failed') ? 'status-error' : 'status-info'
              }`}>
                {status}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;