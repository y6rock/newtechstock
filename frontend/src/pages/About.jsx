import React from 'react';
import './shared.css'; // Import shared styles
import aboutImage from '../assets/images/laptops.jpeg'; // Example image
import { FaShieldAlt, FaDollarSign } from 'react-icons/fa'; // Assuming you have react-icons installed

const About = () => {
  return (
    <div className="simple-page-container">
      <h1>About TechStock</h1>
      <p>Your premier destination for cutting-edge technology products and exceptional service.</p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginTop: '30px' }}>
        <div style={{ flex: 1 }}>
          <h2>Our Story</h2>
          <p>
            Founded in 2018, TechStock began with a simple mission: to provide tech enthusiasts with high-quality
            products at fair prices, backed by exceptional customer service.
          </p>
          <p>
            What started as a small online store has grown into a trusted retailer of premium tech products,
            serving customers nationwide. Our commitment to quality and customer satisfaction remains at the heart of
            everything we do.
          </p>
          <p>
            Today, we offer a carefully curated selection of products from leading brands in computing, mobile
            devices, audio, and accessories. Each product in our inventory is selected based on performance,
            reliability, and value.
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <img src={aboutImage} alt="About TechStock" style={{ width: '100%', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Our Values Section */}
      <section style={{ backgroundColor: '#eee', padding: '60px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2em', marginBottom: '40px', color: '#333' }}>Our Values</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
          {/* Quality Card */}
          <div style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            flexBasis: '300px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <FaShieldAlt size={40} color="#3459e6" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5em', marginBottom: '10px', color: '#555' }}>Quality</h3>
            <p style={{ lineHeight: '1.6', color: '#666' }}>
              We partner with trusted brands and rigorously test
              all products to ensure they meet our high
              standards for performance and reliability.
            </p>
          </div>
          {/* Value Card */}
          <div style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            flexBasis: '300px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <FaDollarSign size={40} color="#3459e6" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5em', marginBottom: '10px', color: '#555' }}>Value</h3>
            <p style={{ lineHeight: '1.6', color: '#666' }}>
              We believe in fair pricing and transparency. Our
              customers deserve the best technology without
              overpaying.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;