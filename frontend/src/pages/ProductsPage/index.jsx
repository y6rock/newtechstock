import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { BsCart, BsSearch } from 'react-icons/bs';
import { formatNumberWithCommas, formatPriceWithTax } from '../../utils/currency';

import './ProductsPage.css';

// Helper to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'ILS': '₪',
    'USD': '$',
    'EUR': '€',
  };
  return symbols[currencyCode] || '$';
};

// Helper to format price with commas (includes tax for customer display)
const formatPriceWithCommas = (price, currency, taxRate = 18) => {
  // Use the tax-included price formatting for customer display
  return formatPriceWithTax(price, currency, taxRate);
};

const ProductsPage = () => {
  const { currency, username, user_id, vat_rate } = useSettings();
  const location = useLocation();
  const { addToCart, validateCart } = useCart();
  const navigate = useNavigate();


  const getInitialSearchTerm = () => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    { category_id: 'All Products', name: 'All Products' }
  ]);
  const [searchTerm, setSearchTerm] = useState(getInitialSearchTerm());

  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceStats, setPriceStats] = useState({ minPrice: 0, maxPrice: 1000 });
  const [manufacturers, setManufacturers] = useState([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState([]);
  
  // Use ref for slider to avoid controlled input issues
  const sliderRef = useRef(null);
  
  // Handle URL parameter changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const categoryParam = params.get('category');
    
    if (searchParam !== null) {
      setSearchTerm(searchParam);
    }
    if (categoryParam !== null) {
      setSelectedCategory(categoryParam);
    }
  }, [location.search]);

  // Removed debounced effect for better responsiveness

  // Clean up duplicates on component mount
  useEffect(() => {
    setSelectedManufacturers(prev => {
      const unique = [...new Set(prev)];
      if (unique.length !== prev.length) {
        return unique;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    // Fetch products
    axios.get('/api/products')
      .then(res => {
        console.log('ProductsPage: Products fetched from backend:', res.data);
        setProducts(res.data);
        
        // Calculate price range from products
        const prices = res.data.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange({ min: minPrice, max: maxPrice });
          setMaxPrice(maxPrice);
          setPriceStats({ minPrice, maxPrice });
        }

        // Manufacturers will be fetched separately from suppliers API
      })
      .catch(err => console.error('ProductsPage: Error fetching products:', err));

    // Fetch categories
    axios.get('/api/categories/public')
      .then(res => {
        console.log('ProductsPage: Categories fetched from backend:', res.data);
        const categoriesData = Array.isArray(res.data) ? res.data : [];
        setCategories([
          { category_id: 'All Products', name: 'All Products' },
          ...categoriesData
        ]);
      })
      .catch(err => console.error('ProductsPage: Error fetching categories:', err));

    // Fetch suppliers (manufacturers)
    axios.get('/api/suppliers/public')
      .then(res => {
        const manufacturerList = res.data.map(supplier => ({
          // Use the numeric supplier_id for filtering and the name for display
          id: String(supplier.supplier_id ?? supplier.id ?? supplier.ID ?? supplier.SupplierID),
          name: supplier.name || supplier.supplier_name || supplier.Name
        }));
        setManufacturers(manufacturerList);
      })
      .catch(err => console.error('ProductsPage: Error fetching suppliers:', err));
  }, []);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Use ref-based handler to avoid React state update conflicts
  const handlePriceChange = (e) => {
    const value = parseFloat(e.target.value);
    console.log('Slider value changed to:', value);
    setMaxPrice(value);
  };

  const handleManufacturerChange = (e) => {
    const { value, checked } = e.target;

    // value holds the supplier_id (string)
    setSelectedManufacturers(prev => {
      if (checked) {
        if (prev.includes(value)) return prev;
        return [...prev, value];
      }
      return prev.filter(id => id !== value);
    });
  };



  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search is handled by the filteredProducts logic
  };

  const handleAddToCart = (product) => {
    if (!username || !user_id) {
      // User is not logged in, redirect to login page
      navigate('/login');
      return;
    }
    
    // User is logged in, proceed with adding to cart
    addToCart(product);
    
    // Validate cart after adding item (with a small delay)
    setTimeout(() => {
      validateCart(false); // Don't show notifications for this validation
    }, 500);
  };

  // Filter products by category, search term, price range, and manufacturer
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const categoryObject = categories.find(c => c.category_id === product.category_id);
      const categoryName = categoryObject ? categoryObject.name : '';
      const matchesCategory = selectedCategory === 'All Products' || categoryName === selectedCategory;
      
      const productPrice = parseFloat(product.price);
      const matchesPrice = productPrice <= maxPrice;

      // Match by supplier_id using selected manufacturer IDs
      const matchesManufacturer =
        selectedManufacturers.length === 0 ||
        selectedManufacturers.includes(String(product.supplier_id));
      
      const matchesSearch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.short_description && product.short_description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        categoryName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesPrice && matchesManufacturer && matchesSearch;
    });
  }, [products, categories, selectedCategory, searchTerm, maxPrice, selectedManufacturers]);

  const FilterSidebar = () => (
    <div className="filters-sidebar">
      <div className="filter-group">
        <h3>Price Range</h3>
        <div className="price-range-container">
          <div className="price-range-display">
            <span className="current-price">
              Up to {getCurrencySymbol(currency)}{formatNumberWithCommas(maxPrice)}
            </span>
          </div>
          <input
            type="range"
            id="priceRange"
            min={priceRange.min}
            max={priceRange.max}
            step="0.01"
            defaultValue={maxPrice}
            onChange={handlePriceChange}
            ref={sliderRef}
            style={{
              width: '100%',
              margin: '15px 0',
              height: '20px',
              background: 'transparent',
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
          <div className="price-range-labels">
            <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(priceRange.min)}</span>
            <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(priceRange.max)}</span>
          </div>
        </div>
      </div>

      <div className="filter-group">
        <h3>Manufacturer</h3>
        <div className="manufacturer-checkboxes">
          {manufacturers.map(manufacturer => {
            const isChecked = selectedManufacturers.includes(manufacturer.name);
            return (
              <div key={manufacturer.id} className="manufacturer-checkbox">
                <label>
                  <input
                    type="checkbox"
                    value={manufacturer.name}
                    checked={isChecked}
                    onChange={handleManufacturerChange}
                  />
                  <span className="checkbox-label">{manufacturer.name}</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="products-page-container">
      {/* Hero Section */}
      <div className="products-hero-section">
        <h1>Our Products</h1>
        <p>Discover our wide range of high-quality products</p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-container">
            <BsSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products, categories, or descriptions..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="clear-search-button"
              >
                ×
              </button>
            )}
          </div>
          <button type="submit" className="search-submit-button">
            Search
          </button>
        </form>
        {searchTerm && (
          <div className="search-results-info">
            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} for "{searchTerm}"
          </div>
        )}
      </div>

      {/* Categories Filter */}
      <div className="categories-filter">
        <div className="categories-filter-buttons">
          {categories.map(cat => (
            <button
              key={cat.category_id}
              onClick={() => handleCategoryChange(cat.name)}
              className={`category-button ${selectedCategory === cat.name ? 'active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="products-page-layout">
        {/* Left Sidebar with Filters */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          height: 'fit-content',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: '1px solid #e8ecf0',
          marginRight: '30px'
        }}>
          {/* Price Range Filter */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              margin: '0 0 15px 0', 
              color: '#2d3748', 
              fontSize: '1.2em', 
              fontWeight: '700',
              paddingBottom: '8px',
              borderBottom: '2px solid #667eea'
            }}>
              Price Range
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                <span style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: '700',
                  fontSize: '1em'
                }}>
                  Up to {getCurrencySymbol(currency)}{formatNumberWithCommas(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                id="priceRange"
                min={priceRange.min}
                max={priceRange.max}
                step="0.01"
                defaultValue={maxPrice}
                onChange={handlePriceChange}
                className="theme-range"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.8em', fontWeight: '500' }}>
                <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(priceRange.min)}</span>
                <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(priceRange.max)}</span>
              </div>
            </div>
          </div>

          {/* Manufacturer Filter */}
          <div>
            <h3 style={{ 
              margin: '0 0 15px 0', 
              color: '#2d3748', 
              fontSize: '1.2em', 
              fontWeight: '700',
              paddingBottom: '8px',
              borderBottom: '2px solid #667eea'
            }}>
              Manufacturer
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {manufacturers.map(manufacturer => {
                const isChecked = selectedManufacturers.includes(String(manufacturer.id));
                return (
                  <div key={manufacturer.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      cursor: 'pointer', 
                      fontSize: '0.9em', 
                      color: '#333',
                      transition: 'color 0.2s ease'
                    }}>
                      <input
                        type="checkbox"
                        value={manufacturer.id}
                        checked={isChecked}
                        onChange={handleManufacturerChange}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          marginRight: '8px',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          border: '2px solid #ccc',
                          borderRadius: '3px',
                          backgroundColor: isChecked ? '#4a90e2' : 'white',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}
                      />
                      <span>{manufacturer.name}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="product-grid-container">
          <div className="product-grid">
            {filteredProducts.length === 0 ? (
              <div className="no-products-message">
                <div className="no-products-icon">🔍</div>
                <h3>No Products Found</h3>
                <p>
                  {searchTerm 
                    ? `No products found matching "${searchTerm}"`
                    : selectedCategory !== 'All Products'
                    ? `No products found in the "${selectedCategory}" category`
                    : `No products available`
                  }
                </p>
                <div className="no-products-suggestions">
                  <p>Try:</p>
                  <ul>
                    <li>Clearing your search term</li>
                    <li>Selecting a different category</li>
                    <li>Browsing all products</li>
                  </ul>
                </div>
                <button 
                  className="clear-filters-button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All Products');
                    setMaxPrice(priceStats.maxPrice);
                    setSelectedManufacturers([]);
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              filteredProducts.map(product => {
                // Enhanced inventory validation
                const hasValidStock = product.stock && product.stock >= 0;
                const isOutOfStock = !hasValidStock || product.stock === 0;
                const stockStatus = !hasValidStock ? 'Invalid Stock' : product.stock === 0 ? 'Out of Stock' : `Stock: ${product.stock}`;
                
                return (
                  <div key={product.product_id} className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
                    <div className="product-image-container">
                      {product.image ? (
                        <img src={product.image && product.image.startsWith('/uploads') ? `http://localhost:3001${product.image}` : product.image || 'https://via.placeholder.com/150'} alt={product.name} className="product-image" />
                      ) : (
                        <div className="product-placeholder-image">Product Image</div>
                      )}
                      {isOutOfStock && (
                        <div className="out-of-stock-badge">
                          {!hasValidStock ? 'Invalid Stock' : 'Out of Stock'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="category-name">{categories.find(c => c.category_id === product.category_id)?.name || 'N/A'}</p>
                      <h4 className="product-name">{product.name}</h4>
                      {product.short_description && (
                      <p className="product-info">{product.short_description}</p>
                    )}
                      <p className="product-price">
                        {formatPriceWithCommas(product.price, currency, vat_rate)}
                      </p>
                      {hasValidStock && product.stock > 0 && (
                        <p className="stock-info">
                          {stockStatus}
                        </p>
                      )}
                      <div className="product-card-actions">
                        <button className="details-button" onClick={() => navigate(`/products/${product.product_id}`)}>For details</button>
                        <button 
                          className={`add-to-cart-button ${isOutOfStock ? 'disabled' : ''}`} 
                          onClick={() => !isOutOfStock && handleAddToCart(product)}
                          disabled={isOutOfStock}
                          title={!hasValidStock ? 'Invalid stock data' : product.stock === 0 ? 'Out of stock' : username ? 'Add to cart' : 'Login to add to cart'}
                        >
                          <BsCart />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage; 