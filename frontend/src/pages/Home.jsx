import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PromotionsBanner from '../components/PromotionsBanner';
import './Home.css'; // Import the new CSS file

// Import category images
import laptopsImage from '../assets/images/laptops.jpeg';
import smartphonesImage from '../assets/images/smartphones.jpg';
import desktopsImage from '../assets/images/desktops.jpeg';
import gamingMouseImage from '../assets/images/gaming_mouse.jpg';
import keyboardsImage from '../assets/images/keyboards.jpg';
import monitorsImage from '../assets/images/monitors.jpeg';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productsRes = await axios.get('/api/products');
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Error fetching data for home page:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading content...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{error}</div>;
  }

  const displayCategories = [
    { name: 'Laptops', description: 'Powerful laptops for work, gaming, and creativity. From ultrabooks to gaming rigs, find the perfect portable computing solution.', imageUrl: laptopsImage },
    { name: 'Smartphones', description: 'Stay connected with cutting-edge smartphones featuring advanced cameras, powerful processors, and stunning displays.', imageUrl: smartphonesImage },
    { name: 'Desktop Computers', description: 'High-performance desktop systems for gaming, content creation, and professional workloads. Build your dream setup.', imageUrl: desktopsImage },
    { name: 'Gaming Mouse', description: 'Precision gaming mice with customizable DPI, programmable buttons, and ergonomic designs for a competitive advantage.', imageUrl: gamingMouseImage },
    { name: 'Mechanical Keyboards', description: 'Premium mechanical keyboards with tactile switches, RGB lighting, and durability for gaming and productivity.', imageUrl: keyboardsImage },
    { name: 'Monitors', description: 'Crystal-clear displays for gaming, design, and productivity. From 4K to ultrawide, enhance your visual experience.', imageUrl: monitorsImage },
  ];

  return (
    <div className="home-container">
      {/* Promotions Banner */}
      <PromotionsBanner />
      
      {/* Hero Section */}
      <section className="hero-section">
        <h1>Tech Excellence</h1>
        <p>Discover premium technology products that enhance your digital lifestyle</p>
        <Link to="/products" className="explore-button">
          Explore Collection
        </Link>
      </section>

      {/* Product Categories Section */}
      <div className="categories-container">
        {displayCategories.map((category) => (
          <div key={category.name} className="category-card">
            <div className="image-container">
              <img src={category.imageUrl} alt={category.name} />
            </div>
            <div className="text-container">
              <h2>{category.name}</h2>
              <p>{category.description}</p>
              <Link to={`/products?category=${category.name}`} className="explore-link">
                Explore {category.name.split(' ')[0]}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;