import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { formatPrice } from '../utils/currency';
import { useSettings } from '../context/SettingsContext';
import './HeaderSearch.css';

const HeaderSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { currency } = useSettings();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search products function
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get('/api/products');
      const filteredProducts = response.data
        .filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(query.toLowerCase())) ||
          (product.short_description && product.short_description.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 8); // Limit to 8 results

      setSearchResults(filteredProducts);
      setShowDropdown(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleProductClick = (product) => {
    navigate(`/products/${product.product_id}`);
    setShowDropdown(false);
    setSearchTerm('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleProductClick(searchResults[selectedIndex]);
        } else if (searchTerm.trim()) {
          // Navigate to products page with search term
          navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
          setShowDropdown(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setShowDropdown(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="header-search" ref={searchRef}>
      <form onSubmit={handleSubmit} className="header-search-form">
        <div className="header-search-input-container">
          <FaSearch className="header-search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="header-search-input"
            autoComplete="off"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="header-search-clear"
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
          {isLoading && (
            <div className="header-search-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && searchResults.length > 0 && (
        <div className="header-search-dropdown" ref={dropdownRef}>
          <div className="header-search-results">
            {searchResults.map((product, index) => (
              <div
                key={product.product_id}
                className={`header-search-result-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => handleProductClick(product)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="result-image-container">
                  <img
                    src={product.image || '/placeholder-image.jpg'}
                    alt={product.name}
                    className="result-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                <div className="result-content">
                  <div className="result-name">{product.name}</div>
                  <div className="result-price">
                    {formatPrice(product.price, currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {searchTerm && (
            <div className="header-search-footer">
              <button
                onClick={() => {
                  navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
                  setShowDropdown(false);
                  setSearchTerm('');
                }}
                className="view-all-results"
              >
                View all results for "{searchTerm}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {showDropdown && searchResults.length === 0 && searchTerm && !isLoading && (
        <div className="header-search-dropdown">
          <div className="no-results">
            <p>No products found for "{searchTerm}"</p>
            <button
              onClick={() => {
                navigate('/products');
                setShowDropdown(false);
                setSearchTerm('');
              }}
              className="browse-all-products"
            >
              Browse all products
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderSearch;
