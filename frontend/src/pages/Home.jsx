import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Import category images
import laptopsImage from '../assets/images/laptops.jpeg';
import smartphonesImage from '../assets/images/smartphones.jpg';
import desktopsImage from '../assets/images/desktops.jpeg';
import gamingMouseImage from '../assets/images/gaming_mouse.jpg';
import keyboardsImage from '../assets/images/keyboards.jpg';
import monitorsImage from '../assets/images/monitors.jpeg';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const categoriesRes = await axios.get('/api/categories');
        const productsRes = await axios.get('/api/products');
        
        setCategories(categoriesRes.data);
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

  // Group products by category for display
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category.name] = products.filter(product => product.category_id === category.category_id);
    return acc;
  }, {});

  // Dummy data for categories that might not have products or for display purposes
  const displayCategories = [
    { name: 'Laptops', description: 'Powerful laptops for work, gaming, and creativity. From ultrabooks to gaming rigs, find the perfect portable computing solution.', imageUrl: laptopsImage },
    { name: 'Smartphones', description: 'Stay connected with cutting-edge smartphones featuring advanced cameras, powerful processors, and stunning displays.', imageUrl: smartphonesImage },
    { name: 'Desktop Computers', description: 'High-performance desktop systems for gaming, content creation, and professional workloads. Build your dream setup.', imageUrl: desktopsImage },
    { name: 'Gaming Mouse', description: 'Precision gaming mice with customizable DPI, programmable buttons, and ergonomic designs for a competitive advantage.', imageUrl: gamingMouseImage },
    { name: 'Mechanical Keyboards', description: 'Premium mechanical keyboards with tactile switches, RGB lighting, and durability for gaming and productivity.', imageUrl: keyboardsImage },
    { name: 'Monitors', description: 'Crystal-clear displays for gaming, design, and productivity. From 4K to ultrawide, enhance your visual experience.', imageUrl: monitorsImage },
  ];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f8f8' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #4b0082, #8a2be2)',
        color: '#fff',
        textAlign: 'center',
        padding: '80px 20px',
        borderRadius: '0 0 15px 15px',
        marginBottom: '40px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '3.5em', marginBottom: '15px', fontWeight: 'bold' }}>Tech Excellence</h1>
        <p style={{ fontSize: '1.2em', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px auto' }}>Discover premium technology products that enhance your digital lifestyle</p>
        <Link to="/products" style={{
          display: 'inline-block',
          padding: '12px 30px',
          backgroundColor: '#fff',
          color: '#4b0082',
          textDecoration: 'none',
          borderRadius: '5px',
          fontWeight: 'bold',
          transition: 'background-color 0.3s ease, color 0.3s ease',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#eee'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#fff'}
        >
          Explore Collection
        </Link>
      </section>

      {/* Product Categories Section */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {displayCategories.map((category, index) => (
          <div key={category.name} style={{
            display: 'flex',
            flexDirection: index % 2 === 0 ? 'row' : 'row-reverse', // Alternate image/text order
            alignItems: 'center',
            marginBottom: '60px',
            backgroundColor: '#fff',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            padding: '20px'
          }}>
            <div style={{
              flex: 1,
              padding: '30px',
              textAlign: index % 2 === 0 ? 'left' : 'right'
            }}>
              <h2 style={{ fontSize: '2em', marginBottom: '10px', color: '#333' }}>{category.name}</h2>
              <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>{category.description}</p>
              <Link to={`/products?category=${category.name}`} style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#ff9900',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s ease',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e68a00'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ff9900'}
              >
                Explore {category.name.split(' ')[0]}
              </Link>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={category.imageUrl} alt={category.name} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;