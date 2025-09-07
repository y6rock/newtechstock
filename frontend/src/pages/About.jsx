import React from 'react';
import './shared.css'; // Import shared styles
import './About.css'; // Import About styles
import aboutImage from '../assets/images/desktops.jpeg'; // Professional tech image
import { FaShieldAlt, FaDollarSign } from 'react-icons/fa'; // Assuming you have react-icons installed

const About = () => {
  return (
    <div className="simple-page-container">
      <h1>About TechStock</h1>
      <p>Your premier destination for cutting-edge technology products and exceptional service.</p>
      
      <div className="about-story-section">
        <div className="about-story-content">
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
        <div className="about-story-image">
          <img src={aboutImage} alt="About TechStock" className="about-image" />
        </div>
      </div>

      {/* Our Values Section */}
      <section className="about-values-section">
        <h2 className="about-values-title">Our Values</h2>
        <div className="about-values-container">
          {/* Quality Card */}
          <div className="about-value-card">
            <FaShieldAlt size={40} color="#3459e6" className="about-value-icon" />
            <h3 className="about-value-title">Quality</h3>
            <p className="about-value-description">
              We partner with trusted brands and rigorously test
              all products to ensure they meet our high
              standards for performance and reliability.
            </p>
          </div>
          {/* Value Card */}
          <div className="about-value-card">
            <FaDollarSign size={40} color="#3459e6" className="about-value-icon" />
            <h3 className="about-value-title">Value</h3>
            <p className="about-value-description">
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