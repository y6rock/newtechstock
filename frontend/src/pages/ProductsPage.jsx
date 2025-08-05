import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { BsCart, BsSearch } from 'react-icons/bs';
import { formatNumberWithCommas } from '../utils/currency';
import './ProductsPage.css'; // Import the new CSS file

// Helper to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'ILS': '₪',
    'USD': '$',
    'EUR': '€',
  };
  return symbols[currencyCode] || '$';
};

// Helper to format price with commas
const formatPriceWithCommas = (price, currency) => {
  if (!price || isNaN(parseFloat(price))) {
    return `${getCurrencySymbol(currency)}0.00`;
  }
  
  const amount = parseFloat(price).toFixed(2);
  const parts = amount.split('.');
  const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedAmount = parts.length > 1 ? `${wholePart}.${parts[1]}` : wholePart;
  
  return `${getCurrencySymbol(currency)}${formattedAmount}`;
};

const ProductsPage = () => {
  const { currency } = useSettings();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    { category_id: 'All Products', name: 'All Products' }
  ]);
  const [manufacturers, setManufacturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Add search state
  const location = useLocation();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search);
    const categoryName = params.get('category');
    if (categoryName) {
      // Since categories are not dynamically fetched anymore, we can simplify this
      return categoryName;
    }
    return 'All Products';
  };

  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [priceRange, setPriceRange] = useState(100000);
  const [selectedManufacturers, setSelectedManufacturers] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false); // State for mobile filters

  // Update selectedCategory if URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryName = params.get('category');
    setSelectedCategory(categoryName || 'All Products');
  }, [location.search]);

  useEffect(() => {
    // Fetch products
    axios.get('/api/products')
      .then(res => {
        console.log('ProductsPage: Products fetched from backend:', res.data);
        setProducts(res.data);
      })
      .catch(err => console.error('ProductsPage: Error fetching products:', err));

    // Fetch categories
    axios.get('/api/categories/public')
      .then(res => {
        console.log('ProductsPage: Categories fetched from backend:', res.data);
        setCategories([
          { category_id: 'All Products', name: 'All Products' },
          ...res.data
        ]);
      })
      .catch(err => console.error('ProductsPage: Error fetching categories:', err));

    // Fetch manufacturers (assuming a /api/manufacturers endpoint exists or can be derived)
    // For now, let's use a placeholder if no dedicated API exists
    const dummyManufacturers = [
      { id: 'gaming_desktops', name: 'Gaming Desktops' },
      { id: 'apple', name: 'Apple' },
      { id: 'samsung', name: 'Samsung' },
      { id: 'dell', name: 'Dell' },
      { id: 'lenovo', name: 'Lenovo' },
      { id: 'asus', name: 'ASUS' },
      { id: 'hp', name: 'HP' },
    ];
    setManufacturers(dummyManufacturers);

  }, []);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // Also update URL to reflect the selected category
    const params = new URLSearchParams(location.search);
    if (category === 'All Products') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    // Use navigate to update URL without full page reload
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handlePriceChange = (e) => {
    setPriceRange(e.target.value);
  };

  const handleManufacturerChange = (e) => {
    const { value, checked } = e.target;
    setSelectedManufacturers(prev =>
      checked ? [...prev, value] : prev.filter(m => m !== value)
    );
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search is handled by the filteredProducts logic
  };

  const filteredProducts = products.filter(product => {
    const categoryObject = categories.find(c => c.category_id === product.category_id);
    const categoryName = categoryObject ? categoryObject.name : '';
    const matchesCategory = selectedCategory === 'All Products' || categoryName === selectedCategory;
    const matchesPrice = parseFloat(product.price) <= parseFloat(priceRange);
    const matchesManufacturer = selectedManufacturers.length === 0 || selectedManufacturers.includes(product.manufacturer_id);
    
    // Add search functionality
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.short_description && product.short_description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesPrice && matchesManufacturer && matchesSearch;
  });

  const FilterSidebar = () => (
    <div className={`filters-sidebar ${filtersOpen ? 'open' : ''}`}>
      <button className="filter-close-button" onClick={() => setFiltersOpen(false)}>&times;</button>
      <div className="filter-group">
        <h3>Price Range</h3>
        <input type="range" min="0" max="100000" value={priceRange} onChange={handlePriceChange} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <span>{getCurrencySymbol(currency)}0</span>
          <span>{formatNumberWithCommas(priceRange)}</span>
        </div>
      </div>
      <div className="filter-group">
        <h3>Manufacturer</h3>
        {manufacturers.map(manufacturer => (
          <div key={manufacturer.id}>
            <label>
              <input type="checkbox" value={manufacturer.id} checked={selectedManufacturers.includes(manufacturer.id)} onChange={handleManufacturerChange} />
              {manufacturer.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="products-page-container">
      <div className="products-hero-section">
        <h1>Premium Computers for Work and Play</h1>
        <p>Discover our extensive range of high-quality products and cutting-edge technology solutions</p>
        <button className="shop-now-button">Shop Now</button>
      </div>

      {/* Add Search Bar */}
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

      <div className="categories-filter">
        <h3>Categories</h3>
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

      <div className="products-page-layout">
        <FilterSidebar />
        <div className="product-grid-container">
          <button className="mobile-filter-button" onClick={() => setFiltersOpen(true)}>Show Filters</button>
          <div className="product-grid">
            {filteredProducts.map(product => {
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
                    <p className="product-info">{product.short_description || 'Little Info (One Line)'}</p>
                    <p className="product-price">
                      {formatPriceWithCommas(product.price, currency)}
                    </p>
                    {hasValidStock && product.stock > 0 && (
                      <p className="stock-info" style={{ fontSize: '0.8em', color: '#666', marginBottom: '10px' }}>
                        {stockStatus}
                      </p>
                    )}
                    <div className="product-card-actions">
                      <button className="details-button" onClick={() => navigate(`/products/${product.product_id}`)}>For details</button>
                      <button 
                        className={`add-to-cart-button ${isOutOfStock ? 'disabled' : ''}`} 
                        onClick={() => !isOutOfStock && addToCart(product)}
                        disabled={isOutOfStock}
                        title={!hasValidStock ? 'Invalid stock data' : product.stock === 0 ? 'Out of stock' : 'Add to cart'}
                      >
                        <BsCart />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage; 