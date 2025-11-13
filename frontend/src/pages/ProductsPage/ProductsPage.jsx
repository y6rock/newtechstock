import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { BsCart, BsSearch } from 'react-icons/bs';
import { formatNumberWithCommas, formatPriceWithTax, getCurrencySymbol } from '../../utils/currency';
import { convertFromILSSync } from '../../utils/exchangeRate';
import Pagination from '../../components/Pagination/Pagination';

import './ProductsPage.css';

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
  const [searchParams, setSearchParams] = useSearchParams();


  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([
    { category_id: 'All Products', name: 'All Products' }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceStats, setPriceStats] = useState({ minPrice: 0, maxPrice: 1000 });
  const [manufacturers, setManufacturers] = useState([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState([]);
  
  // Use ref for slider to avoid controlled input issues
  const sliderRef = useRef(null);
  // AbortController ref to cancel in-flight requests
  const abortControllerRef = useRef(null);
  // Ref for search input to maintain focus
  const searchInputRef = useRef(null);
  const isTypingRef = useRef(false);
  
  // Function to fetch products with current filters
  const fetchProducts = useCallback(async (pageOverride = null) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const pageToUse = pageOverride !== null ? pageOverride : pagination.currentPage;
      const params = new URLSearchParams();
      
      if (selectedCategory && selectedCategory !== 'All Products') {
        params.append('category', selectedCategory);
        console.log('Adding category filter:', selectedCategory);
      }
      
      // Only add maxPrice filter if it's actually filtering (less than the max available price)
      // Also check if priceStats.maxPrice is valid (greater than 0) to avoid sending invalid filters
      // Use a small epsilon to handle floating point comparison issues
      // Allow maxPrice to be 0 (user can set slider to 0 to filter out all products)
      if (priceStats.maxPrice > 0 && maxPrice !== null && maxPrice !== undefined && maxPrice < priceStats.maxPrice - 0.01) {
        params.append('maxPrice', maxPrice.toString());
        console.log('Adding maxPrice filter:', maxPrice, '(max available:', priceStats.maxPrice, ')');
      } else {
        console.log('Skipping maxPrice filter - maxPrice:', maxPrice, 'priceStats.maxPrice:', priceStats.maxPrice);
      }
      
      if (selectedManufacturers.length > 0) {
        selectedManufacturers.forEach(id => params.append('manufacturer', id));
        console.log('Adding manufacturer filters:', selectedManufacturers);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
        console.log('Adding search filter:', searchTerm);
      }
      
      params.append('page', pageToUse.toString());
      params.append('limit', '10');
      
      console.log('Fetching products with params:', params.toString());
      const response = await axios.get(`/api/products?${params}`, {
        signal: abortController.signal
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      console.log('ProductsPage: Products fetched with filters:', response.data);
      
      if (response.data && response.data.products) {
        setProducts(response.data.products);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else if (Array.isArray(response.data)) {
        // Fallback for old API format
        setProducts(response.data);
      } else {
        console.warn('Unexpected response format:', response.data);
        setProducts([]);
      }
    } catch (error) {
      // Don't log error if request was aborted
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('ProductsPage: Request aborted');
        return;
      }
      console.error('ProductsPage: Error fetching products:', error);
      setProducts([]);
    } finally {
      // Only update loading state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedCategory, maxPrice, selectedManufacturers, priceStats.maxPrice, searchTerm]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Handle URL parameter changes for category only (search is handled by handleSearchChange)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    
    // Only sync from URL if it's different from current state (avoid loops)
    if (categoryParam !== null && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    } else if (categoryParam === null && selectedCategory !== 'All Products') {
      setSelectedCategory('All Products');
    }
  }, [location.search]); // Removed selectedCategory from deps to avoid loops

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

  // Fetch price statistics based on current filters
  const fetchPriceStats = useCallback(async () => {
    const params = new URLSearchParams();
    
    if (selectedCategory && selectedCategory !== 'All Products') {
      params.append('category', selectedCategory);
    }
    
    if (selectedManufacturers.length > 0) {
      selectedManufacturers.forEach(id => params.append('manufacturer', id));
    }
    
    try {
      const response = await axios.get(`/api/products/price-stats?${params.toString()}`);
      console.log('ProductsPage: Price stats fetched with filters:', response.data);
      const newPriceRange = { min: response.data.minPrice, max: response.data.maxPrice };
      console.log('ProductsPage: Updating priceRange to:', newPriceRange);
      setPriceStats(response.data);
      setPriceRange(newPriceRange);
      
      // Always reset maxPrice to the new max when filters change
      // This ensures the slider shows the full range of filtered products
      const newMaxPrice = response.data.maxPrice;
      console.log('ProductsPage: Updating maxPrice to:', newMaxPrice);
      setMaxPrice(newMaxPrice);
    } catch (err) {
      console.error('ProductsPage: Error fetching price stats:', err);
    }
  }, [selectedCategory, selectedManufacturers]);

  useEffect(() => {
    // Fetch initial price statistics (no filters)
    fetchPriceStats();

    // Fetch categories (only active for filters)
    axios.get('/api/categories/public')
      .then(res => {
        console.log('ProductsPage: Categories fetched from backend:', res.data);
        const categoriesData = Array.isArray(res.data) ? res.data : [];
        // Filter to only show active categories (backend should already filter, but double-check)
        const activeCategories = categoriesData.filter(cat => {
          const isActive = cat.isActive !== undefined ? cat.isActive : (cat.isActive === undefined ? true : false);
          return isActive === 1 || isActive === true;
        });
        setCategories([
          { category_id: 'All Products', name: 'All Products', isActive: true },
          ...activeCategories
        ]);
      })
      .catch(err => console.error('ProductsPage: Error fetching categories:', err));

    // Fetch suppliers (manufacturers) - only active
    axios.get('/api/suppliers/public')
      .then(res => {
        // Filter to only show active suppliers
        const manufacturerList = res.data
          .filter(supplier => {
            const isActive = supplier.isActive !== undefined ? supplier.isActive : true;
            return isActive === 1 || isActive === true;
          })
          .map(supplier => ({
            // Use the numeric supplier_id for filtering and the name for display
            id: String(supplier.supplier_id ?? supplier.id ?? supplier.ID ?? supplier.SupplierID),
            name: supplier.name || supplier.supplier_name || supplier.Name,
            isActive: supplier.isActive !== undefined ? supplier.isActive : true
          }));
        setManufacturers(manufacturerList);
      })
      .catch(err => console.error('ProductsPage: Error fetching suppliers:', err));
  }, []);

  // Update price stats when category or manufacturer filters change
  useEffect(() => {
    fetchPriceStats();
  }, [selectedCategory, selectedManufacturers, fetchPriceStats]);

  // Fetch products when filters change (but not when search term or page changes - page changes are handled directly)
  useEffect(() => {
    console.log('fetchProducts useEffect triggered');
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchProducts(1);
  }, [selectedCategory, maxPrice, selectedManufacturers, fetchProducts]);

  // Handle search term changes - simple state update, no URL updates during typing
  const handleSearchChange = useCallback((newSearchTerm) => {
    isTypingRef.current = true;
    setSearchTerm(newSearchTerm);
    // Don't update URL or fetch here - let the debounced effect handle it
    // This prevents the input from losing focus on every keystroke
  }, []);

  // Auto-refocus search input after re-renders to maintain typing experience
  useEffect(() => {
    if (searchInputRef.current && searchTerm && isTypingRef.current) {
      // Use requestAnimationFrame to ensure focus happens after render
      requestAnimationFrame(() => {
        if (searchInputRef.current && isTypingRef.current) {
          searchInputRef.current.focus();
          // Restore cursor position to end
          const len = searchInputRef.current.value.length;
          searchInputRef.current.setSelectionRange(len, len);
        }
      });
    }
  });

  // Debounced search effect - performs search after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to page 1 when search changes
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      // Fetch products with current search term
      fetchProducts(1);
      // Clear typing flag after search completes
      isTypingRef.current = false;
    }, 300); // 300ms debounce (same as Customers)
    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchProducts]);

  // Initial fetch after price stats are loaded
  useEffect(() => {
    if (priceStats.maxPrice > 0) {
      console.log('Initial fetch triggered after price stats loaded');
      fetchProducts(1);
    }
  }, [priceStats.maxPrice, fetchProducts]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
    
    // Update URL to reflect category change
    const params = new URLSearchParams(searchParams);
    if (category === 'All Products') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    params.set('page', '1'); // Reset to page 1
    setSearchParams(params);
    
    // Price stats will be updated via useEffect
  };


  const handleManufacturerChange = (e) => {
    const { value, checked } = e.target;

    // Prevent selecting inactive manufacturers
    const manufacturer = manufacturers.find(m => String(m.id) === value);
    if (manufacturer && (manufacturer.isActive === false || manufacturer.isActive === 0)) {
      return; // Don't allow selection of inactive manufacturers
    }

    // value holds the supplier_id (string)
    setSelectedManufacturers(prev => {
      if (checked) {
        if (prev.includes(value)) return prev;
        return [...prev, value];
      }
      return prev.filter(id => id !== value);
    });
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };



  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The debounced effect will handle the search
    // Just ensure we're on page 1
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchProducts(1);
  };

  const handlePageChange = async (newPage) => {
    // Scroll to top of product grid when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update pagination state first
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    
    // Fetch products for the new page using fetchProducts with page override
    await fetchProducts(newPage);
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

  // Products are now filtered on the backend, so we use products directly


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
              ref={searchInputRef}
              type="text"
              placeholder="Search products, categories, or descriptions..."
              value={searchTerm}
              onFocus={() => {
                isTypingRef.current = true;
              }}
              onBlur={() => {
                // Only clear typing flag after a delay to allow focus restoration
                setTimeout(() => {
                  isTypingRef.current = false;
                }, 100);
              }}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  isTypingRef.current = false;
                }}
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
            Found {products.length} product{products.length !== 1 ? 's' : ''} for "{searchTerm}"
          </div>
        )}
      </div>

      {/* Categories Filter */}
      <div className="categories-filter">
        <div className="categories-filter-buttons">
          {categories.map(cat => {
            const isInactive = cat.isActive === false || cat.isActive === 0;
            return (
              <button
                key={cat.category_id}
                onClick={() => !isInactive && handleCategoryChange(cat.name)}
                disabled={isInactive}
                className={`category-button ${selectedCategory === cat.name ? 'active' : ''} ${isInactive ? 'inactive' : ''}`}
                title={isInactive ? 'This category is inactive' : ''}
              >
                {cat.name}{isInactive ? ' (Inactive)' : ''}
              </button>
            );
          })}
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
                  {formatPriceWithTax(priceRange.min, currency, vat_rate)} - {formatPriceWithTax(priceRange.max, currency, vat_rate)}
                </span>
              </div>
              <input
                key={`price-slider-${currency}-${priceRange.min}-${priceRange.max}`}
                type="range"
                id="priceRange"
                min={convertFromILSSync(priceRange.min, currency)}
                max={convertFromILSSync(priceRange.max, currency)}
                step="0.01"
                value={convertFromILSSync(maxPrice, currency)}
                onChange={(e) => {
                  // Convert the slider value (in current currency) back to ILS for filtering
                  const valueInCurrentCurrency = parseFloat(e.target.value);
                  // Convert back to ILS: if currency is ILS, no conversion needed
                  // Otherwise, we need to reverse the conversion
                  let valueInILS;
                  if (currency === 'ILS') {
                    valueInILS = valueInCurrentCurrency;
                  } else {
                    // Reverse conversion: valueInILS = valueInCurrentCurrency / rate
                    // rate = convertFromILSSync(1, currency) gives us how many units of target currency = 1 ILS
                    // So to reverse: valueInILS = valueInCurrentCurrency / rate
                    const rate = convertFromILSSync(1, currency);
                    valueInILS = valueInCurrentCurrency / rate;
                  }
                  console.log('Slider value changed to:', valueInCurrentCurrency, 'in', currency, '=', valueInILS, 'in ILS');
                  setMaxPrice(valueInILS);
                  setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
                }}
                className="theme-range"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.8em', fontWeight: '500' }}>
                <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(convertFromILSSync(priceRange.min, currency))}</span>
                <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(convertFromILSSync(priceRange.max, currency))}</span>
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
                const isInactive = manufacturer.isActive === false || manufacturer.isActive === 0;
                return (
                  <div key={manufacturer.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      cursor: isInactive ? 'not-allowed' : 'pointer', 
                      fontSize: '0.9em', 
                      color: isInactive ? '#999' : '#333',
                      transition: 'color 0.2s ease',
                      opacity: isInactive ? 0.6 : 1
                    }}>
                      <input
                        type="checkbox"
                        value={manufacturer.id}
                        checked={isChecked}
                        disabled={isInactive}
                        onChange={handleManufacturerChange}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: isInactive ? 'not-allowed' : 'pointer',
                          marginRight: '8px',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          border: '2px solid #ccc',
                          borderRadius: '3px',
                          backgroundColor: isChecked ? '#4a90e2' : 'white',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          opacity: isInactive ? 0.5 : 1
                        }}
                      />
                      <span>{manufacturer.name}{isInactive ? ' (Inactive)' : ''}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="product-grid-container">
          <div className="product-grid">
            {loading ? (
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
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
              products.map(product => {
                // Enhanced inventory validation
                const hasValidStock = product.stock && product.stock >= 0;
                const isOutOfStock = !hasValidStock || product.stock === 0;
                const stockStatus = !hasValidStock ? 'Invalid Stock' : product.stock === 0 ? 'Stock: 0' : `Stock: ${product.stock}`;
                
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
                      {hasValidStock && (
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
          
          {/* Pagination */}
          {!loading && products.length > 0 && pagination.totalPages > 1 && (
            <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage; 