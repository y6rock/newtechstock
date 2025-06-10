import React from 'react';
import { FaShieldAlt, FaDollarSign } from 'react-icons/fa'; // Assuming you have react-icons installed
import laptopsImage from '../assets/images/laptops.jpeg'; // Import the laptops image

const About = () => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f8f8', color: '#333' }}>
      {/* Hero Section */}
      <section style={{
        background: '#3459e6', // A shade of blue similar to the image
        color: '#fff',
        textAlign: 'center',
        padding: '60px 20px',
        marginBottom: '40px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '10px', fontWeight: 'bold' }}>About TechStock</h1>
        <p style={{ fontSize: '1.1em', maxWidth: '700px', margin: '0 auto' }}>Your premier destination for cutting-edge technology products and exceptional service.</p>
      </section>

      {/* Our Story Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 60px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '40px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '2em', marginBottom: '20px', color: '#333' }}>Our Story</h2>
            <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
              Founded in 2018, TechStock began with a simple mission: to provide tech enthusiasts with
              high-quality products at fair prices, backed by exceptional customer service.
            </p>
            <p style={{ lineHeight: '1.8', marginBottom: '15px' }}>
              What started as a small online store has grown into a trusted retailer of premium tech
              products, serving customers nationwide. Our commitment to quality and customer
              satisfaction remains at the heart of everything we do.
            </p>
            <p style={{ lineHeight: '1.8' }}>
              Today, we offer a carefully curated selection of products from leading brands in computing,
              mobile devices, audio, and accessories. Each product in our inventory is selected based on
              performance, reliability, and value.
            </p>
          </div>
          <div style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={laptopsImage} alt="Modern Building" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
          </div>
        </div>
      </section>

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