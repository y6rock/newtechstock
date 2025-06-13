import React, { useState } from 'react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Your message has been sent successfully!');
        setName(''); setEmail(''); setMessage('');
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
    <div style={{ fontFamily: 'Arial', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Blue Header */}
      <div style={{ background: '#2563eb', color: 'white', padding: '40px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5em', margin: 0 }}>Contact Us</h2>
        <p style={{ fontSize: '1.2em', marginTop: '10px' }}>
          Have questions about our products or services? Our team is here to help you.
        </p>
      </div>

      {/* Contact Information Section */}
      <div style={{ maxWidth: 1000, margin: '40px auto 0', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '40px 30px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: 30, fontSize: '1.7em', color: '#222' }}>Contact Information</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 30 }}>
          {/* Location */}
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', marginBottom: 10 }}>📍</div>
            <div style={{ fontWeight: 'bold', marginBottom: 5 }}>Our Location</div>
            <div>123 Tech Avenue<br/>Silicon Valley, CA 94043<br/>United States</div>
          </div>
          {/* Email */}
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', marginBottom: 10 }}>✉️</div>
            <div style={{ fontWeight: 'bold', marginBottom: 5 }}>Email Us</div>
            <div>support@techstock.com<br/>sales@techstock.com</div>
          </div>
          {/* Phone */}
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', marginBottom: 10 }}>📞</div>
            <div style={{ fontWeight: 'bold', marginBottom: 5 }}>Call Us</div>
            <div>Customer Support: (223) 456-7890<br/>Sales Inquiries: (712) 654-7891</div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '40px auto', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '30px 25px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: 20, color: '#2563eb' }}>Send Us a Message</h3>
        <input
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: 6, border: '1px solid #ddd' }}
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: 6, border: '1px solid #ddd' }}
          required
        />
        <textarea
          placeholder="Message"
          rows="5"
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ddd' }}
          required
        ></textarea>
        <button
          type="submit"
          style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, width: '100%', fontWeight: 'bold', fontSize: '1em' }}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
        {status && <div style={{ marginTop: 15, color: status.includes('successfully') ? 'green' : 'red', textAlign: 'center' }}>{status}</div>}
      </form>
    </div>
  );
}