import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { BsCart, BsSearch } from 'react-icons/bs';
import { formatNumberWithCommas, formatPriceWithTax, getCurrencySymbol } from '../../utils/currency';
import { convertFromILSSync } from '../../utils/exchangeRate';
import { calculatePriceWithTax, calculateBasePriceFromTaxIncluded } from '../../utils/tax';
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
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load
  const [isFiltering, setIsFiltering] = useState(false); // Track when filters are being applied
  const [categories, setCategories] = useState([
    { category_id: 'All Products', name: 'All Products' }
  ]);
  // Initialize search term and page from URL if present
  const initialParams = new URLSearchParams(location.search);
  const initialSearchParam = initialParams.get('search') || '';
  const initialPageParam = parseInt(initialParams.get('page')) || 1;
  const [searchTerm, setSearchTerm] = useState(initialSearchParam);
  const [pagination, setPagination] = useState({
    currentPage: initialPageParam,
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
  // Ref to prevent URL sync effect from interfering with programmatic page changes
  const isChangingPageRef = useRef(false);
  // Ref to track if initial fetch has been done
  const hasInitiallyFetchedRef = useRef(false);
  // Ref to track initial mount to prevent setSearchParams on first render
  const isInitialMountRef = useRef(true);
  // Ref to track if URL sync has completed initial sync
  const hasCompletedInitialUrlSyncRef = useRef(false);
  // Refs to persist categories and manufacturers to prevent flickering
  const categoriesRef = useRef([{ category_id: 'All Products', name: 'All Products' }]);
  const manufacturersRef = useRef([]);
  
  // Function to fetch products with current filters
  const fetchProducts = useCallback(async (pageOverride = null) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Set loading state - only show full loading on initial load when no products exist
    // For filter changes, keep products visible with subtle loading indicator
    if (isInitialLoad && products.length === 0) {
      setLoading(true);
      setIsFiltering(false);
    } else {
      // For subsequent loads, keep products visible but show filtering indicator
      setLoading(false); // Don't hide products during filter changes
      setIsFiltering(true); // Show subtle loading overlay
    }
    
    try {
      // Determine page to use:
      // 1. If pageOverride is provided, use it (explicit page change)
      // 2. Otherwise, read from URL (single source of truth)
      // 3. Fallback to pagination.currentPage if URL doesn't have page param
      let pageToUse;
      if (pageOverride !== null && pageOverride !== undefined) {
        pageToUse = parseInt(pageOverride, 10);
        } else {
        // Read from URL (single source of truth)
        const urlParams = new URLSearchParams(location.search);
        const urlPage = urlParams.get('page');
        if (urlPage) {
          pageToUse = parseInt(urlPage, 10);
        } else {
          pageToUse = parseInt(pagination.currentPage, 10);
        }
      }
      
      // Validate page number
      if (isNaN(pageToUse) || pageToUse < 1) {
        console.error('Invalid page number:', pageToUse);
        return;
      }
      
      const params = new URLSearchParams();
      
      if (selectedCategory && selectedCategory !== 'All Products') {
        params.append('category', selectedCategory);
      }
      
      // Only add maxPrice filter if it's actually filtering (less than the max available price)
      // Also check if priceStats.maxPrice is valid (greater than 0) to avoid sending invalid filters
      // Use a small epsilon to handle floating point comparison issues
      // Allow maxPrice to be 0 (user can set slider to 0 to filter out all products)
      if (priceStats.maxPrice > 0 && maxPrice !== null && maxPrice !== undefined && maxPrice < priceStats.maxPrice - 0.01) {
        params.append('maxPrice', maxPrice.toString());
      }
      
      if (selectedManufacturers.length > 0) {
        selectedManufacturers.forEach(id => params.append('manufacturer', id));
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      params.append('page', pageToUse.toString());
      params.append('limit', '10');
      const response = await axios.get(`/api/products?${params}`, {
        signal: abortController.signal
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      if (response.data && response.data.products) {
        // Mark initial load as complete after first successful fetch
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
        setProducts(response.data.products);
        if (response.data.pagination) {
          // Preserve the page we requested if it's different from what backend returned
          // This ensures the page number in state matches what we requested
          const finalPage = pageToUse; // Use the page we requested
          setPagination(prev => ({
            ...response.data.pagination,
            currentPage: finalPage // Use the page we requested, not what backend might return
          }));
        } else {
          // If no pagination in response, just update currentPage
          setPagination(prev => ({ ...prev, currentPage: pageToUse }));
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
        return;
      }
      console.error('ProductsPage: Error fetching products:', error);
      setProducts([]);
    } finally {
      // Only update loading state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
        setIsFiltering(false);
        // Mark initial load as complete even if no products found
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
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
  
  // Handle URL parameter changes for category, search, and page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    const searchParam = params.get('search');
    const pageParam = parseInt(params.get('page')) || 1;
    
    // During initial mount, sync from URL but don't trigger filter effects
    const isInitialSync = !hasCompletedInitialUrlSyncRef.current;
    if (isInitialSync) {
      hasCompletedInitialUrlSyncRef.current = true;
    }
    
    // Sync category from URL
    // During initial sync, suppress filter change effect by using a flag
    if (categoryParam !== null && categoryParam !== selectedCategory) {
      if (isInitialSync) {
        // During initial sync, set category but prevent filter effect from running
        // by temporarily disabling the filter effect trigger
        isInitialMountRef.current = true; // Keep this true to prevent filter effect
      }
      setSelectedCategory(categoryParam);
      if (isInitialSync) {
        // After state update, mark as not initial mount so future changes work
        setTimeout(() => {
          isInitialMountRef.current = false;
        }, 0);
      }
    } else if (categoryParam === null && selectedCategory !== 'All Products') {
      if (isInitialSync) {
        isInitialMountRef.current = true;
      }
      setSelectedCategory('All Products');
      if (isInitialSync) {
        setTimeout(() => {
          isInitialMountRef.current = false;
        }, 0);
      }
    }
    
    // Sync search from URL (when navigating from header search)
    if (searchParam !== null && searchParam !== searchTerm) {
      // Clear typing flag when setting from URL (not user typing)
      isTypingRef.current = false;
      setSearchTerm(searchParam);
      // Don't trigger fetch here - let the debounced search effect handle it
    } else if (searchParam === null && searchTerm) {
      // If search param is removed from URL, clear search
      isTypingRef.current = false;
      setSearchTerm('');
    }
    
    // Sync page from URL (for browser back/forward navigation only)
    // Skip if we're programmatically changing the page (handlePageChange handles it)
    if (isChangingPageRef.current) {
      return; // Early return to skip all URL sync logic
    }
    
    if (pageParam !== pagination.currentPage) {
      // Update pagination state
      setPagination(prev => ({ ...prev, currentPage: pageParam }));
      // Fetch products for the page from URL (pass pageParam as override)
      fetchProducts(pageParam);
    }
  }, [location.search]); // Removed fetchProducts from deps to prevent re-runs when fetchProducts is recreated
  // Note: fetchProducts is intentionally not in deps - it's called directly when needed

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
      const newPriceRange = { min: response.data.minPrice, max: response.data.maxPrice };
      setPriceStats(response.data);
      setPriceRange(newPriceRange);
      
      // Always reset maxPrice to the new max when filters change
      // This ensures the slider shows the full range of filtered products
      const newMaxPrice = response.data.maxPrice;
      setMaxPrice(newMaxPrice);
    } catch (err) {
      console.error('ProductsPage: Error fetching price stats:', err);
      // Don't clear state on error - keep existing price stats
    }
  }, [selectedCategory, selectedManufacturers]);

  useEffect(() => {
    // Fetch initial price statistics (no filters)
    fetchPriceStats();

    // Fetch categories (only active for filters)
    axios.get('/api/categories/public')
      .then(res => {
        const categoriesData = Array.isArray(res.data) ? res.data : [];
        // Filter to only show active categories (backend should already filter, but double-check)
        const activeCategories = categoriesData.filter(cat => {
          const isActive = cat.isActive !== undefined ? cat.isActive : (cat.isActive === undefined ? true : false);
          return isActive === 1 || isActive === true;
        });
        // Always update with valid data (categories should always have at least "All Products")
        const newCategories = [
          { category_id: 'All Products', name: 'All Products', isActive: true },
          ...activeCategories
        ];
        categoriesRef.current = newCategories;
        setCategories(newCategories);
      })
      .catch(err => {
        console.error('ProductsPage: Error fetching categories:', err);
        // Don't clear categories on error - keep existing ones from ref
        if (categoriesRef.current.length > 0) {
          setCategories(categoriesRef.current);
        }
      });

    // Fetch suppliers (manufacturers) - only active
    axios.get('/api/suppliers/public')
      .then(res => {
        // Ensure res.data is an array
        if (!Array.isArray(res.data)) {
          console.error('ProductsPage: Invalid suppliers data format:', res.data);
          return;
        }
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
        // Always update with valid data
        manufacturersRef.current = manufacturerList;
        setManufacturers(manufacturerList);
      })
      .catch(err => {
        console.error('ProductsPage: Error fetching suppliers:', err);
        // Don't clear manufacturers on error - keep existing ones from ref
        if (manufacturersRef.current.length > 0) {
          setManufacturers(manufacturersRef.current);
        }
      });
  }, []);

  // Update price stats when category or manufacturer filters change
  useEffect(() => {
    fetchPriceStats();
  }, [selectedCategory, selectedManufacturers, fetchPriceStats]);

  // Fetch products when filters change (but not when search term or page changes - page changes are handled directly)
  // Note: fetchProducts is NOT in dependencies to avoid resetting page when fetchProducts is recreated
  useEffect(() => {
    // Skip on initial mount to prevent "operation is insecure" error
    // React Router needs to be fully initialized before we can safely call setSearchParams
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // Update URL to remove page param when filters change
    // Use setTimeout to defer setSearchParams to next event loop to ensure React Router is ready
    setTimeout(() => {
      try {
        const params = new URLSearchParams(searchParams);
        params.delete('page');
        setSearchParams(params);
      } catch (error) {
        // Silently fail - URL will be updated on next safe opportunity
      }
    }, 0);
    // Fetch products for page 1
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, maxPrice, selectedManufacturers]);

  // Handle search term changes - simple state update, no URL updates during typing
  const handleSearchChange = useCallback((newSearchTerm) => {
    isTypingRef.current = true;
    setSearchTerm(newSearchTerm);
    // Don't update URL or fetch here - let the debounced effect handle it
    // This prevents the input from losing focus on every keystroke
  }, []);

  // Auto-refocus search input after re-renders to maintain typing experience
  // Only run when searchTerm or isTypingRef changes to avoid unnecessary re-renders
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
  }, [searchTerm]); // Only re-run when searchTerm changes

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

  // Initial fetch after price stats are loaded (only once on mount)
  useEffect(() => {
    if (priceStats.maxPrice > 0 && !hasInitiallyFetchedRef.current) {
      hasInitiallyFetchedRef.current = true;
      fetchProducts(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceStats.maxPrice]); // Removed fetchProducts from deps to prevent re-runs

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
    
    // Update URL to reflect category change
    // Use setTimeout to defer setSearchParams to next event loop to ensure React Router is ready
    setTimeout(() => {
      try {
        const params = new URLSearchParams(searchParams);
        if (category === 'All Products') {
          params.delete('category');
        } else {
          params.set('category', category);
        }
        params.set('page', '1'); // Reset to page 1
        setSearchParams(params);
      } catch (error) {
        console.warn('ProductsPage: Could not update search params in handleCategoryChange:', error.message);
        // Silently fail - URL will be updated on next safe opportunity
      }
    }, 0);
    
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
    // Set flag to prevent URL sync effect from interfering
    isChangingPageRef.current = true;
    
    // Scroll to top of product grid when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update pagination state FIRST to prevent URL sync effect from interfering
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    
    // Update URL with page parameter (like Customers page)
    // Use setTimeout to defer navigation to next event loop to ensure React Router is ready
    setTimeout(() => {
      try {
        const params = new URLSearchParams(searchParams);
        if (newPage === 1) {
          params.delete('page');
        } else {
          params.set('page', newPage.toString());
        }
        // Preserve other URL params (category, search, etc.)
        // Use navigate to ensure URL updates in address bar
        const newSearch = params.toString();
        navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: false });
      } catch (error) {
        // Silently fail - URL will be updated on next safe opportunity
      }
    }, 0);
    
    // Fetch products for the new page (like Categories page - simple and direct)
    await fetchProducts(newPage);
    
    // Reset flag after a longer delay to ensure URL sync effect doesn't interfere
    // The delay needs to be long enough for the URL update and fetch to complete
    setTimeout(() => {
      isChangingPageRef.current = false;
    }, 500);
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
          {(categories.length > 0 ? categories : categoriesRef.current).map(cat => {
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
              fontWeight: '700'
            }}>
              Price Range
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                key={`price-slider-${currency}-${priceRange.min}-${priceRange.max}`}
                type="range"
                id="priceRange"
                min={calculatePriceWithTax(convertFromILSSync(priceRange.min, currency), vat_rate)}
                max={calculatePriceWithTax(convertFromILSSync(priceRange.max, currency), vat_rate)}
                step="0.01"
                value={calculatePriceWithTax(convertFromILSSync(maxPrice, currency), vat_rate)}
                onChange={(e) => {
                  // Slider value is in current currency WITH tax
                  const valueWithTaxInCurrentCurrency = parseFloat(e.target.value);
                  // Convert to base price (without tax) in current currency
                  const basePriceInCurrentCurrency = calculateBasePriceFromTaxIncluded(valueWithTaxInCurrentCurrency, vat_rate);
                  
                  // Convert base price from current currency back to ILS for filtering
                  let basePriceInILS;
                  if (currency === 'ILS') {
                    basePriceInILS = basePriceInCurrentCurrency;
                  } else {
                    // Reverse conversion: basePriceInILS = basePriceInCurrentCurrency / rate
                    const rate = convertFromILSSync(1, currency);
                    basePriceInILS = basePriceInCurrentCurrency / rate;
                  }
                  console.log('Slider value changed to:', valueWithTaxInCurrentCurrency, 'with tax in', currency, 'base price:', basePriceInCurrentCurrency, 'in', currency, '=', basePriceInILS, 'in ILS');
                  setMaxPrice(basePriceInILS);
                  setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
                }}
                className="theme-range"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.8em', fontWeight: '500' }}>
                <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(calculatePriceWithTax(convertFromILSSync(priceRange.min, currency), vat_rate))}</span>
                <span>{getCurrencySymbol(currency)}{formatNumberWithCommas(calculatePriceWithTax(convertFromILSSync(priceRange.max, currency), vat_rate))}</span>
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
              {(manufacturers.length > 0 ? manufacturers : manufacturersRef.current).map(manufacturer => {
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
          <div className="product-grid" style={{ position: 'relative' }}>
            {/* Show full loading only on initial load when no products exist */}
            {loading && isInitialLoad && products.length === 0 ? (
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
              <>
                {products.map(product => {
                  // Enhanced inventory validation
                  const hasValidStock = product.stock && product.stock >= 0;
                  const isOutOfStock = !hasValidStock || product.stock === 0;
                  const stockStatus = !hasValidStock ? 'Invalid Stock' : product.stock === 0 ? 'Stock: 0' : `Stock: ${product.stock}`;
                  
                  return (
                    <div key={product.product_id} className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`} style={{ 
                      opacity: isFiltering ? 0.6 : 1,
                      transition: 'opacity 0.2s ease'
                    }}>
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
              })}
              {/* Subtle loading overlay during filter changes */}
              {isFiltering && products.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  pointerEvents: 'none',
                  transition: 'opacity 0.2s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
                    <p style={{ color: '#667eea', fontWeight: 500, margin: 0 }}>Updating...</p>
                  </div>
                </div>
              )}
            </>
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