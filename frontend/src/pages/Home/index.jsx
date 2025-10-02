import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PromotionsBanner from '../../components/PromotionsBanner';
import './Home.css';

// Import fallback category images
import laptopsImage from '../../assets/images/laptops.jpeg';
import smartphonesImage from '../../assets/images/smartphones.jpg';
import desktopsImage from '../../assets/images/desktops.jpeg';
import gamingMouseImage from '../../assets/images/gaming_mouse.jpg';
import keyboardsImage from '../../assets/images/keyboards.jpg';
import monitorsImage from '../../assets/images/monitors.jpeg';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get('/api/products'),
          axios.get('/api/categories/public') // Fetch only active categories
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
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
    return <div className="home-loading">Loading content...</div>;
  }

  if (error) {
    return <div className="home-error">{error}</div>;
  }

  // Fallback images mapping
  const getFallbackImage = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('laptop')) return laptopsImage;
    if (name.includes('smartphone') || name.includes('phone')) return smartphonesImage;
    if (name.includes('desktop')) return desktopsImage;
    if (name.includes('mouse')) return gamingMouseImage;
    if (name.includes('keyboard')) return keyboardsImage;
    if (name.includes('monitor')) return monitorsImage;
    // Default fallback
    return laptopsImage;
  };

  // Default descriptions for categories that don't have one
  const getDefaultDescription = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('laptop')) return 'Powerful laptops for work, gaming, and creativity. From ultrabooks to gaming rigs, find the perfect portable computing solution.';
    if (name.includes('smartphone') || name.includes('phone')) return 'Stay connected with cutting-edge smartphones featuring advanced cameras, powerful processors, and stunning displays.';
    if (name.includes('desktop')) return 'High-performance desktop systems for gaming, content creation, and professional workloads. Build your dream setup.';
    if (name.includes('mouse')) return 'Precision gaming mice with customizable DPI, programmable buttons, and ergonomic designs for a competitive advantage.';
    if (name.includes('keyboard')) return 'Premium mechanical keyboards with tactile switches, RGB lighting, and durability for gaming and productivity.';
    if (name.includes('monitor')) return 'Crystal-clear displays for gaming, design, and productivity. From 4K to ultrawide, enhance your visual experience.';
    return `Discover our premium ${categoryName.toLowerCase()} collection with the latest technology and best value.`;
  };

  // Process categories from database
  const displayCategories = categories.map(category => ({
    id: category.category_id,
    name: category.name,
    description: category.description || getDefaultDescription(category.name),
    imageUrl: category.image || getFallbackImage(category.name)
  }));

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
        {displayCategories.length > 0 ? (
          displayCategories.map((category) => (
            <div key={category.id} className="category-card">
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
          ))
        ) : (
          <div className="no-categories">
            <p>No categories available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;