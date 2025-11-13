import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductModal from '../ProductModal/ProductModal';
import Pagination from '../Pagination/Pagination';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatPriceWithTax, formatBasePrice } from '../../utils/currency';
import './ProductManager.css';

function ProductManager() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', image: '', supplier_id: '', category_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const searchInputRef = useRef(null);
  const isTypingRef = useRef(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ field: 'product_id', direction: 'desc' });
  
  const { isUserAdmin, loadingSettings, currency, vat_rate } = useSettings();
  const { showSuccess, showError, showConfirm } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem('token');
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const [globalStats, setGlobalStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0
  });

  const isInitialLoad = useRef(true);
  const previousFilters = useRef({
    statusFilter,
    categoryFilter,
    supplierFilter
  });

  // Map UI field names to API sort fields
  const mapToApiSortField = (field) => {
    if (field === 'category_id') return 'category_name';
    if (field === 'supplier_id') return 'supplier_name';
    if (field === 'is_active') return 'status';
    return field;
  };

  // Handle column sorting (server-side) - URL is the single source of truth
  const handleSort = (field) => {
    const urlSortField = searchParams.get('sortField');
    const urlSortDirection = searchParams.get('sortDirection') || 'asc';
    const currentUiField = (urlSortField === 'category_name') ? 'category_id'
      : (urlSortField === 'supplier_name') ? 'supplier_id'
      : (urlSortField === 'status') ? 'is_active'
      : urlSortField || sortConfig.field;

    const isSameField = currentUiField === field;
    const nextDirection = isSameField ? (urlSortDirection === 'asc' ? 'desc' : 'asc') : 'asc';

    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    params.set('sortField', mapToApiSortField(field));
    params.set('sortDirection', nextDirection);
    setSearchParams(params);
    // sortConfig will be synced from URL in the URL sync effect
  };

  // Fetch global statistics for products (with current filters)
  const fetchGlobalStats = useCallback(async () => {
    if (loadingSettings || !isUserAdmin) return;
    
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const params = new URLSearchParams();
      // Read filters directly from URL (single source of truth)
      const currentSearch = searchParams.get('search') || '';
      const urlCategoryFilter = searchParams.get('category') || 'all';
      const urlSupplierFilter = searchParams.get('supplier') || 'all';
      
      // Don't include status filter - we want stats to show breakdown of all statuses
      // for the current filtered set (category, supplier, search)
      if (urlCategoryFilter && urlCategoryFilter !== 'all') {
        params.append('category', urlCategoryFilter);
      }
      if (urlSupplierFilter && urlSupplierFilter !== 'all') {
        params.append('supplier', urlSupplierFilter);
      }
      if (currentSearch.trim()) {
        params.append('search', currentSearch.trim());
      }
      
      const response = await fetch(`/api/products/admin/stats?${params.toString()}`, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const statsData = await response.json();
      setGlobalStats({
        totalProducts: statsData.totalProducts || 0,
        activeProducts: statsData.activeProducts || 0,
        inactiveProducts: statsData.inactiveProducts || 0
      });
    } catch (err) {
      console.error('Error fetching global statistics:', err);
    }
  }, [loadingSettings, isUserAdmin, searchParams]);

  // Stock level indicator function
  const getStockLevel = (stock) => {
    if (stock <= 0) return { level: 'out', class: 'stock-out-of-stock', text: 'OUT OF STOCK' };
    if (stock <= 10) return { level: 'low', class: 'stock-low-stock', text: 'LOW STOCK' };
    if (stock <= 20) return { level: 'medium', class: 'stock-medium-stock', text: 'MEDIUM STOCK' };
    return { level: 'high', class: 'stock-high-stock', text: 'HIGH STOCK' };
  };


  // Helper function to fetch all suppliers (handles pagination)
  const fetchAllSuppliers = useCallback(async (headers) => {
    try {
      const firstPageRes = await fetch('/api/suppliers?limit=10000&page=1', { headers });
      if (!firstPageRes.ok) throw new Error('Failed to fetch suppliers');
      const firstPageData = await firstPageRes.json();
      
      let allSuppliers = firstPageData.suppliers || (Array.isArray(firstPageData) ? firstPageData : []);
      
      // If there are more pages, fetch them all
      if (firstPageData.pagination && firstPageData.pagination.totalPages > 1) {
        const additionalPages = await Promise.all(
          Array.from({ length: firstPageData.pagination.totalPages - 1 }, (_, i) => 
            fetch(`/api/suppliers?limit=10000&page=${i + 2}`, { headers })
              .then(res => res.json())
              .then(data => data.suppliers || [])
          )
        );
        allSuppliers = [...allSuppliers, ...additionalPages.flat()];
      }
      
      return allSuppliers;
    } catch (err) {
      console.error('Error fetching all suppliers:', err);
      return [];
    }
  }, []);

  // Helper function to fetch all categories (handles pagination)
  const fetchAllCategories = useCallback(async (headers) => {
    try {
      const firstPageRes = await fetch('/api/categories?limit=10000&page=1', { headers });
      if (!firstPageRes.ok) throw new Error('Failed to fetch categories');
      const firstPageData = await firstPageRes.json();
      
      let allCategories = firstPageData.categories || (Array.isArray(firstPageData) ? firstPageData : []);
      
      // If there are more pages, fetch them all
      if (firstPageData.pagination && firstPageData.pagination.totalPages > 1) {
        const additionalPages = await Promise.all(
          Array.from({ length: firstPageData.pagination.totalPages - 1 }, (_, i) => 
            fetch(`/api/categories?limit=10000&page=${i + 2}`, { headers })
              .then(res => res.json())
              .then(data => data.categories || [])
          )
        );
        allCategories = [...allCategories, ...additionalPages.flat()];
      }
      
      return allCategories;
    } catch (err) {
      console.error('Error fetching all categories:', err);
      return [];
    }
  }, []);

  const fetchProductData = useCallback(async (pageOverride = null, searchOverride = null) => {
    if (loadingSettings || !isUserAdmin) {
      if (!loadingSettings && !isUserAdmin) navigate('/');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Read all parameters from URL (single source of truth)
      const urlPage = pageOverride !== null ? pageOverride : (parseInt(searchParams.get('page')) || 1);
      const urlSearch = searchOverride !== null ? searchOverride : (searchParams.get('search') || '');
      const urlStatusFilter = searchParams.get('status') || 'all';
      const urlCategoryFilter = searchParams.get('category') || 'all';
      const urlSupplierFilter = searchParams.get('supplier') || 'all';
      const urlSortField = searchParams.get('sortField');
      const urlSortDirection = searchParams.get('sortDirection') || 'asc';
      
      const params = new URLSearchParams({
        page: urlPage.toString(),
        limit: '10'
      });
      
      if (urlSearch.trim()) {
        params.append('search', urlSearch.trim());
      }
      
      // Add filter parameters from URL
      if (urlStatusFilter && urlStatusFilter !== 'all') {
        params.append('status', urlStatusFilter);
      }
      
      if (urlCategoryFilter && urlCategoryFilter !== 'all') {
        params.append('category', urlCategoryFilter);
      }
      
      if (urlSupplierFilter && urlSupplierFilter !== 'all') {
        params.append('supplier', urlSupplierFilter);
      }

      // Add sorting params from URL
      if (urlSortField) {
        params.append('sortField', urlSortField);
        params.append('sortDirection', urlSortDirection);
      }
      
      console.log('Fetching products with params:', params.toString());
      console.log('API URL:', `/api/products/admin/all?${params}`);
      console.log('Headers:', headers);
      
      const productsRes = await fetch(`/api/products/admin/all?${params}`, { headers });
      if (!productsRes.ok) {
        throw new Error('Failed to fetch initial product data.');
      }

      const productsData = await productsRes.json();
      setProducts(productsData.products || productsData);
      
      // Fetch all suppliers and categories using helper functions
      const [allSuppliers, allCategories] = await Promise.all([
        fetchAllSuppliers(headers),
        fetchAllCategories(headers)
      ]);
      
      setSuppliers(allSuppliers);
      setCategories(allCategories);
      
      if (productsData.pagination) {
        setPagination(productsData.pagination);
      }

    } catch (err) {
      console.error('Error fetching initial product data:', err);
      setError('Failed to load necessary data. Please try again.');
    }
  }, [isUserAdmin, loadingSettings, navigate, searchParams]); // Read all from URL, no need for filter state

  // Handle page changes
  const handlePageChange = useCallback((newPage) => {
    console.log('=== PAGE CHANGE DEBUG ===');
    console.log('Page change requested:', newPage);
    console.log('Current searchParams:', searchParams.toString());
    console.log('Current searchTerm:', searchTerm);
    console.log('Current pagination:', pagination);
    
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    // Keep sort in URL (use existing URL values only)
    const existingUrlSortField = searchParams.get('sortField');
    const existingUrlSortDirection = searchParams.get('sortDirection');
    if (existingUrlSortField && existingUrlSortDirection) {
      params.set('sortField', existingUrlSortField);
      params.set('sortDirection', existingUrlSortDirection);
    }
    
    console.log('New params:', params.toString());
    setSearchParams(params);
    // Update pagination state immediately
    setPagination(prev => {
      console.log('Updating pagination from:', prev, 'to:', { ...prev, currentPage: newPage });
      return { ...prev, currentPage: newPage };
    });
    console.log('=== END PAGE CHANGE DEBUG ===');
  }, [searchParams, setSearchParams, searchTerm, pagination]);

  // Handle search term changes - simple state update, no URL updates during typing
  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    // Don't update URL params here - let the debounced effect handle it
    // This prevents the input from losing focus on every keystroke
  }, []);

  // Load global statistics on mount
  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  // Refresh stats when filters change (but not status - stats show breakdown of all statuses)
  // Read filters directly from URL, so we only need to watch searchParams
  useEffect(() => {
    fetchGlobalStats();
  }, [searchParams, fetchGlobalStats]);

  // Initial load and URL parameter sync
  useEffect(() => {
    console.log('=== URL PARAMS SYNC DEBUG ===');
    const currentPage = parseInt(searchParams.get('page')) || 1;
    const currentSearch = searchParams.get('search') || '';
    const urlStatusFilter = searchParams.get('status') || 'all';
    const urlCategoryFilter = searchParams.get('category') || 'all';
    const urlSupplierFilter = searchParams.get('supplier') || 'all';
    const urlSortField = searchParams.get('sortField') || null;
    const urlSortDirection = searchParams.get('sortDirection') || null;
    
    console.log('URL params - page:', currentPage, 'search:', currentSearch);
    console.log('URL filters - status:', urlStatusFilter, 'category:', urlCategoryFilter, 'supplier:', urlSupplierFilter);
    console.log('Current filter state:', { statusFilter, categoryFilter, supplierFilter });
    console.log('Current pagination state:', pagination);
    
    // Do not write URL from state; URL is the source of truth

    // Only update if URL params differ from current state or if it's initial load
    // Don't update searchTerm if user is actively typing (to prevent focus loss)
    const shouldUpdate = isInitialLoad.current || 
      (!isTypingRef.current && currentSearch !== searchTerm) ||
      urlStatusFilter !== statusFilter ||
      urlCategoryFilter !== categoryFilter ||
      urlSupplierFilter !== supplierFilter ||
      (urlSortField && (!sortConfig.field || mapToApiSortField(sortConfig.field) !== urlSortField || sortConfig.direction !== (urlSortDirection || 'asc'))) ||
      currentPage !== pagination.currentPage;
    
    if (!shouldUpdate && !isInitialLoad.current) {
      console.log('No changes detected, skipping');
      return;
    }
    
    // Only update searchTerm from URL if user is not actively typing
    if (!isTypingRef.current || isInitialLoad.current) {
      setSearchTerm(currentSearch);
    }
    setStatusFilter(urlStatusFilter);
    setCategoryFilter(urlCategoryFilter);
    setSupplierFilter(urlSupplierFilter);
    if (urlSortField) {
      // Map back from API name to UI field
      let uiField = urlSortField;
      if (urlSortField === 'category_name') uiField = 'category_id';
      if (urlSortField === 'supplier_name') uiField = 'supplier_id';
      if (urlSortField === 'status') uiField = 'is_active';
      setSortConfig({ field: uiField, direction: (urlSortDirection === 'desc' ? 'desc' : 'asc') });
    }
    setPagination(prev => {
      console.log('Setting pagination from URL:', { ...prev, currentPage });
      return { ...prev, currentPage };
    });
    
    console.log('About to call fetchProductData with page:', currentPage, 'search:', currentSearch);
    
    // Always fetch data, but handle filters appropriately
    if (isInitialLoad.current) {
      // Initial load - fetch with filters applied via the dedicated fetch function
      previousFilters.current = {
        statusFilter: urlStatusFilter,
        categoryFilter: urlCategoryFilter,
        supplierFilter: urlSupplierFilter
      };
      
      // Call fetchProductData which will apply current filter state
      const fetchWithFilters = async () => {
        if (loadingSettings || !isUserAdmin) return;
        
        try {
          const token = localStorage.getItem('token');
          const headers = { 'Authorization': `Bearer ${token}` };
          
          const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: '10'
          });
          
          if (currentSearch.trim()) {
            params.append('search', currentSearch.trim());
          }
          
          // Add filter parameters from URL
          if (urlStatusFilter && urlStatusFilter !== 'all') {
            params.append('status', urlStatusFilter);
          }
          
          if (urlCategoryFilter && urlCategoryFilter !== 'all') {
            params.append('category', urlCategoryFilter);
          }
          
          if (urlSupplierFilter && urlSupplierFilter !== 'all') {
            params.append('supplier', urlSupplierFilter);
          }

          // Add sort from URL directly
          if (urlSortField) {
            params.append('sortField', urlSortField);
            params.append('sortDirection', (urlSortDirection === 'desc' ? 'desc' : 'asc'));
          }
          
          const productsUrl = `/api/products/admin/all?${params.toString()}`;
          console.log('Fetching products with URL:', productsUrl);
          const productsRes = await fetch(productsUrl, { headers });

          if (!productsRes.ok) {
            throw new Error('Failed to fetch product data.');
          }

          const productsData = await productsRes.json();
          setProducts(productsData.products || productsData);
          
          // Fetch all suppliers and categories using helper functions
          const [allSuppliers, allCategories] = await Promise.all([
            fetchAllSuppliers(headers),
            fetchAllCategories(headers)
          ]);
          
          setSuppliers(allSuppliers);
          setCategories(allCategories);
          
          if (productsData.pagination) {
            setPagination(productsData.pagination);
          }
        } catch (err) {
          console.error('Error fetching product data:', err);
        }
      };
      
      fetchWithFilters();
    } else {
      // Not initial load - use simple fetch for page changes
      fetchProductData();
    }
    
    // Mark initial load as complete
    isInitialLoad.current = false;
    console.log('=== END URL PARAMS SYNC DEBUG ===');
  }, [searchParams]);

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

  // Debounced search effect - performs search directly (like Customers), no URL updates during typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isUserAdmin && !loadingSettings && searchTerm.trim()) {
        // Only perform search if there's actually a search term
        const performSearch = async () => {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              throw new Error('No token found');
            }

            const headers = { 'Authorization': `Bearer ${token}` };
            
            // Read current filters from URL (single source of truth)
            const urlStatusFilter = searchParams.get('status') || 'all';
            const urlCategoryFilter = searchParams.get('category') || 'all';
            const urlSupplierFilter = searchParams.get('supplier') || 'all';
            const urlSortField = searchParams.get('sortField');
            const urlSortDirection = searchParams.get('sortDirection') || 'asc';

            const fetchParams = new URLSearchParams({
              page: '1',
              limit: '10'
            });

            if (searchTerm.trim()) {
              fetchParams.append('search', searchTerm.trim());
            }

            // Add filter parameters from URL
            if (urlStatusFilter && urlStatusFilter !== 'all') {
              fetchParams.append('status', urlStatusFilter);
            }
            
            if (urlCategoryFilter && urlCategoryFilter !== 'all') {
              fetchParams.append('category', urlCategoryFilter);
            }
            
            if (urlSupplierFilter && urlSupplierFilter !== 'all') {
              fetchParams.append('supplier', urlSupplierFilter);
            }

            // Sorting from URL only
            if (urlSortField) {
              fetchParams.append('sortField', urlSortField);
              fetchParams.append('sortDirection', urlSortDirection);
            }

            const response = await fetch(`/api/products/admin/all?${fetchParams}`, { headers });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setProducts(data.products || data);

            if (data.pagination) {
              setPagination(data.pagination);
            } else {
              setPagination(prev => ({
                ...prev,
                currentPage: 1 // Reset to page 1 when searching
              }));
            }

            // Don't update URL during typing to prevent focus loss
            // URL can be updated after search completes if needed for bookmarking

          } catch (error) {
            console.error('Error fetching products:', error);
            showError('Failed to fetch products');
          }
        };
        
        performSearch();
      } else if (isUserAdmin && !loadingSettings && !searchTerm.trim()) {
        // If search term is cleared, reload the current page without search
        const loadCurrentPage = async () => {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              throw new Error('No token found');
            }

            const headers = { 'Authorization': `Bearer ${token}` };
            
            // Read current filters and page from URL
            const page = parseInt(searchParams.get('page')) || 1;
            const urlStatusFilter = searchParams.get('status') || 'all';
            const urlCategoryFilter = searchParams.get('category') || 'all';
            const urlSupplierFilter = searchParams.get('supplier') || 'all';
            const urlSortField = searchParams.get('sortField');
            const urlSortDirection = searchParams.get('sortDirection') || 'asc';

            const params = new URLSearchParams({
              page: page.toString(),
              limit: '10'
            });
            
            if (urlStatusFilter && urlStatusFilter !== 'all') {
              params.append('status', urlStatusFilter);
            }
            
            if (urlCategoryFilter && urlCategoryFilter !== 'all') {
              params.append('category', urlCategoryFilter);
            }
            
            if (urlSupplierFilter && urlSupplierFilter !== 'all') {
              params.append('supplier', urlSupplierFilter);
            }

            // Sorting from URL only
            if (urlSortField) {
              params.append('sortField', urlSortField);
              params.append('sortDirection', urlSortDirection);
            }

            const response = await fetch(`/api/products/admin/all?${params}`, { headers });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setProducts(data.products || data);

            if (data.pagination) {
              setPagination(data.pagination);
            } else {
              setPagination(prev => ({
                ...prev,
                currentPage: page
              }));
            }
          } catch (error) {
            console.error('Error clearing search:', error);
            showError('Failed to clear search');
          }
        };
        
        loadCurrentPage();
      }
    }, 300); // 300ms debounce (same as Customers)

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isUserAdmin, loadingSettings, searchParams, showError]);

  // Refetch when sorting changes (via URL sync updating sortConfig)
  // This is handled by the main URL sync effect, so we don't need a separate effect

  // Fetch products when filters change (but not on initial load)
  useEffect(() => {
    // Skip if this is the initial load
    if (isInitialLoad.current) {
      console.log('Skipping filter effect on initial load');
      return;
    }
    
    // Check if filters actually changed
    const filtersChanged = 
      previousFilters.current.statusFilter !== statusFilter ||
      previousFilters.current.categoryFilter !== categoryFilter ||
      previousFilters.current.supplierFilter !== supplierFilter;
    
    if (!filtersChanged) {
      console.log('Filters unchanged, skipping');
      return;
    }
    
    console.log('Filters changed, refetching products');
    console.log('Previous filters:', previousFilters.current);
    console.log('Current filters:', { statusFilter, categoryFilter, supplierFilter });
    
    // Update previous filters
    previousFilters.current = {
      statusFilter,
      categoryFilter,
      supplierFilter
    };
    
    const currentSearch = searchParams.get('search') || '';
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    // Create a new fetch function with current filter values
    const fetchWithCurrentFilters = async () => {
      if (loadingSettings || !isUserAdmin) return;

      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const params = new URLSearchParams({
          page: '1',
          limit: '10'
        });
        
        if (currentSearch.trim()) {
          params.append('search', currentSearch.trim());
        }
        
        // Add current filter parameters
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        if (categoryFilter && categoryFilter !== 'all') {
          params.append('category', categoryFilter);
        }
        
        if (supplierFilter && supplierFilter !== 'all') {
          params.append('supplier', supplierFilter);
        }

        // Add sorting params from URL only
        const urlSortField = searchParams.get('sortField');
        const urlSortDirection = searchParams.get('sortDirection') || 'asc';
        if (urlSortField) {
          params.append('sortField', urlSortField);
          params.append('sortDirection', urlSortDirection);
        }
        
        console.log('Fetching products with filters:', params.toString());
        console.log('Filter API URL:', `/api/products/admin/all?${params}`);
        console.log('Filter Headers:', headers);
        
          const productsRes = await fetch(`/api/products/admin/all?${params}`, { headers });

        if (!productsRes.ok) {
          throw new Error('Failed to fetch product data.');
        }

        const productsData = await productsRes.json();
        setProducts(productsData.products || productsData);
        
        // Fetch all suppliers and categories using helper functions
        const [allSuppliers, allCategories] = await Promise.all([
          fetchAllSuppliers(headers),
          fetchAllCategories(headers)
        ]);
        
        setSuppliers(allSuppliers);
        setCategories(allCategories);
        
        if (productsData.pagination) {
          setPagination(productsData.pagination);
        }

      } catch (err) {
        console.error('Error fetching product data:', err);
        setError('Failed to load product data. Please try again.');
      }
    };
    
    fetchWithCurrentFilters();
  }, [statusFilter, categoryFilter, supplierFilter, loadingSettings, isUserAdmin]);

  const handleChange = e => {
    const { name, value } = e.target;
    
    // Validation for price and stock
    if (name === 'price') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setMessage('Price must be a non-negative number');
        return;
      }
    }
    
    if (name === 'stock') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0 || !Number.isInteger(numValue)) {
        setMessage('Stock must be a non-negative integer');
        return;
      }
    }
    
    setForm({ ...form, [name]: value });
    setMessage(''); // Clear any previous error messages
  };

  const handleImageFileChange = e => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setForm({ ...form, image: '' }); // Clear image URL if file is selected
    } else {
      setImagePreview('');
    }
  };

  const handleImageUrlChange = e => {
    setForm({ ...form, image: e.target.value });
    setImageFile(null); // Clear file if URL is entered
    setImagePreview(e.target.value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('handleSubmit triggered');
    
    // Basic validation
    if (!form.name || !form.description || !form.price || !form.stock || (!form.image && !imageFile)) {
      setMessage('Please fill in all required fields, and provide an image file or URL.');
      console.log('Validation failed: Missing required fields.');
      return;
    }

    // Validate price
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      setMessage('Price must be a non-negative number');
      return;
    }

    // Validate stock
    const stock = parseInt(form.stock);
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      setMessage('Stock must be a non-negative integer');
      return;
    }

    if (!token) {
      setMessage('You must be logged in to upload images. Please log in and try again.');
      console.log('Validation failed: Missing token.');
      return;
    }

    let imageUrl = form.image;
    if (imageFile) {
      // Upload image file to backend
      const data = new FormData();
      data.append('image', imageFile);
      try {
        console.log('Attempting to upload image...');
        const uploadRes = await axios.post('/api/auth/upload-image', data, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        imageUrl = uploadRes.data.imageUrl;
        console.log('Image uploaded successfully:', imageUrl);
      } catch (err) {
        setMessage('Image upload failed');
        console.error('Image upload error:', err);
        return;
      }
    }
    try {
      console.log('Attempting to add product via POST /api/products...');
      console.log('Product payload to be sent:', {
        ...form,
        image: imageUrl,
        supplier_id: form.supplier_id || null,
        category_id: form.category_id || null
      });
      console.log('Token used for product POST:', token);
      const res = await axios.post('/api/products', {
        ...form,
        image: imageUrl,
        supplier_id: form.supplier_id || null,
        category_id: form.category_id || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('POST /api/products promise resolved. Response:', res.data);
      setMessage(res.data.message);
      console.log('POST /api/products successful. Response:', res.data);
      // Reload products after adding
      console.log('Attempting to re-fetch products after successful addition...');
      const currentPage = pagination.currentPage;
      const currentSearch = searchParams.get('search') || '';
      fetchProductData();
      setShowAddForm(false);
      setForm({ name: '', description: '', price: '', stock: '', image: '', supplier_id: '', category_id: '' });
      setImageFile(null);
      setImagePreview('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error adding product');
      console.error('Error adding product frontend (full error object):', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: parseFloat(product.price).toFixed(2),
      stock: product.stock,
      image: product.image,
      supplier_id: product.supplier_id || '',
      category_id: product.category_id || '',
    });
    setImagePreview(product.image);
    setImageFile(null); // Clear any previously selected file when editing via URL
    setShowAddForm(true); // Show the form for editing
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.name || !form.description || !form.price || !form.stock || (!form.image && !imageFile)) {
      setMessage('Please fill in all required fields, and provide an image file or URL.');
      return;
    }

    // Validate price
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      setMessage('Price must be a non-negative number');
      return;
    }

    // Validate stock
    const stock = parseInt(form.stock);
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      setMessage('Stock must be a non-negative integer');
      return;
    }

    if (!token) {
      setMessage('You must be logged in to upload images. Please log in and try again.');
      return;
    }

    let imageUrl = form.image;
    if (imageFile) {
      const data = new FormData();
      data.append('image', imageFile);
      try {
        const uploadRes = await axios.post('/api/auth/upload-image', data, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        imageUrl = uploadRes.data.imageUrl;
      } catch (err) {
        setMessage('Image upload failed');
        return;
      }
    }

    try {
      // Ensure price is a valid number before sending
      const updateData = {
        ...form,
        price: parseFloat(form.price), // Ensure price is a number
        stock: parseInt(form.stock),   // Ensure stock is a number
        image: imageUrl,
        supplier_id: form.supplier_id || null,
        category_id: form.category_id || null
      };
      
      const res = await axios.put(`/api/products/${editingProduct.product_id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message);
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', stock: '', image: '', supplier_id: '', category_id: '' });
      setImageFile(null);
      setImagePreview('');
      setShowAddForm(false);
      
      // Reload products after updating
      const currentPage = pagination.currentPage;
      const currentSearch = searchParams.get('search') || '';
      fetchProductData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    showConfirm(
      'Are you sure you want to deactivate this product? It will be hidden from customers but can be restored later.',
      async () => {
        try {
          const res = await axios.delete(`/api/products/${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showSuccess('Product deactivated successfully!');
          // Remove product from local state immediately for instant feedback
          setProducts(prevProducts => prevProducts.filter(p => p.product_id !== productId));
          // Reload products after deactivating - read all params from URL
          await fetchProductData();
          await fetchGlobalStats(); // Refresh global statistics
        } catch (err) {
          showError(err.response?.data?.message || 'Error deactivating product');
          // On error, refetch to restore correct state
          await fetchProductData();
        }
      }
    );
  };

  const handleRestoreProduct = async (productId) => {
    showConfirm(
      'Are you sure you want to restore this product? It will be visible to customers again.',
      async () => {
        try {
          const res = await axios.patch(`/api/products/${productId}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showSuccess('Product restored successfully!');
          // Reload products after restoring - read all params from URL
          await fetchProductData();
          await fetchGlobalStats(); // Refresh global statistics
        } catch (err) {
          showError(err.response?.data?.message || 'Error restoring product');
          // On error, refetch to restore correct state
          await fetchProductData();
        }
      }
    );
  };



  const handleOpenModalForAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSuccess = async (isEdit = false) => {
    handleCloseModal();
    try {
      // Reload products - read all params from URL (filters, search, page, sort)
      await fetchProductData();
      await fetchGlobalStats(); // Refresh global statistics
      
      // Show success toast
      if (isEdit) {
        showSuccess('Product updated successfully!');
      } else {
        showSuccess('Product added successfully!');
      }
    } catch (err) {
      console.error('Error fetching product data after success:', err);
      showError('Product was saved, but failed to refresh the list.');
    }
  };

  // Client-side sorting only (search handled by backend)

  return (
    <div className="product-manager-main-container">
      <h1 className="product-manager-title">Products</h1>
      <p className="product-manager-subtitle">Manage your product catalog</p>

      {/* Search Section - Like Customers */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        marginBottom: '30px',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ position: 'relative' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products by name, description, or category..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '14px 20px 14px 45px',
              border: '2px solid #e1e5e9',
              borderRadius: '12px',
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.3s ease',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e1e5e9';
              e.target.style.boxShadow = 'none';
            }}
          />
          <span style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '18px',
            color: '#6c757d',
            pointerEvents: 'none'
          }}>
            🔍
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#6c757d',
                cursor: 'pointer',
                padding: '5px',
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.color = '#dc3545'}
              onMouseLeave={(e) => e.target.style.color = '#6c757d'}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls - Enhanced Layout */}
      <div className="search-filter-controls">
        
        {/* Status Filter */}
        <div className="status-filter-container">
          <select
            value={statusFilter}
            onChange={(e) => {
              const newStatus = e.target.value;
              setStatusFilter(newStatus);
              // Update URL
              const params = new URLSearchParams(searchParams);
              params.set('page', '1'); // Reset to page 1 on filter change
              if (newStatus !== 'all') {
                params.set('status', newStatus);
              } else {
                params.delete('status');
              }
              setSearchParams(params);
            }}
            className="status-filter-select"
          >
            <option value="all">All Products ({globalStats.totalProducts})</option>
            <option value="active">Active ({globalStats.activeProducts})</option>
            <option value="inactive">Inactive ({globalStats.inactiveProducts})</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="category-filter-container">
          <select
            value={categoryFilter}
            onChange={(e) => {
              const newCategory = e.target.value;
              setCategoryFilter(newCategory);
              // Update URL
              const params = new URLSearchParams(searchParams);
              params.set('page', '1'); // Reset to page 1 on filter change
              if (newCategory !== 'all') {
                params.set('category', newCategory);
              } else {
                params.delete('category');
              }
              setSearchParams(params);
            }}
            className="category-filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier Filter */}
        <div className="supplier-filter-container">
          <select
            value={supplierFilter}
            onChange={(e) => {
              const newSupplier = e.target.value;
              setSupplierFilter(newSupplier);
              // Update URL
              const params = new URLSearchParams(searchParams);
              params.set('page', '1'); // Reset to page 1 on filter change
              if (newSupplier !== 'all') {
                params.set('supplier', newSupplier);
              } else {
                params.delete('supplier');
              }
              setSearchParams(params);
            }}
            className="supplier-filter-select"
          >
            <option value="all">All Suppliers</option>
            {suppliers.filter(s => s.isActive === 1).map(supplier => (
              <option key={supplier.supplier_id} value={supplier.supplier_id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Filter Info */}
        <div className="filter-info-container">
          <span>Showing {products.length} products</span>
          {(statusFilter !== 'all' || categoryFilter !== 'all' || supplierFilter !== 'all' || searchTerm) && (
            <button 
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setSupplierFilter('all');
                setSearchTerm('');
                // Clear all filters from URL
                const params = new URLSearchParams();
                params.set('page', '1');
                // Keep sort if it exists
                const urlSortField = searchParams.get('sortField');
                const urlSortDirection = searchParams.get('sortDirection');
                if (urlSortField && urlSortDirection) {
                  params.set('sortField', urlSortField);
                  params.set('sortDirection', urlSortDirection);
                }
                setSearchParams(params);
              }}
              className="clear-filters-button"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Product Statistics */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-value stat-value-total">
            {globalStats.totalProducts}
          </div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-active">
            {globalStats.activeProducts}
          </div>
          <div className="stat-label">Active Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-inactive">
            {globalStats.inactiveProducts}
          </div>
          <div className="stat-label">Inactive Products</div>
        </div>
      </div>

      <div className="add-product-container">
        <button
          className="add-product-button"
          onClick={handleOpenModalForAdd}
        >
          Add New Product
        </button>
      </div>

      {message && <p>{message}</p>}

      <h3>Products List</h3>
      <div className="products-table-wrapper">
        <table className="products-table">
          <thead>
            <tr className="table-header-row">
              <th className="table-header-cell">Image</th>
              <th 
                className={`table-header-cell sortable ${sortConfig.field === 'name' ? 'active' : ''}`}
                onClick={() => handleSort('name')}
              >
                Name
              <span className="sort-arrow">
                  {sortConfig.field === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </span>
              </th>
              <th 
                className={`table-header-cell sortable ${sortConfig.field === 'category_id' ? 'active' : ''}`}
                onClick={() => handleSort('category_id')}
              >
                Category
                <span className="sort-arrow">
                  {sortConfig.field === 'category_id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`table-header-cell sortable ${sortConfig.field === 'price' ? 'active' : ''}`}
                onClick={() => handleSort('price')}
              >
                Price (Base / Final)
                <span className="sort-arrow">
                  {sortConfig.field === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`table-header-cell sortable ${sortConfig.field === 'stock' ? 'active' : ''}`}
                onClick={() => handleSort('stock')}
              >
                Stock
                <span className="sort-arrow">
                  {sortConfig.field === 'stock' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`table-header-cell sortable ${sortConfig.field === 'is_active' ? 'active' : ''}`}
                onClick={() => handleSort('is_active')}
              >
                Status
                <span className="sort-arrow">
                  {sortConfig.field === 'is_active' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.product_id} className="table-body-row">
                <td className="table-body-cell">
                  {p.image ? (
                    <img 
                      src={p.image && p.image.startsWith('/uploads') ? `http://localhost:3001${p.image}` : p.image || 'https://via.placeholder.com/50'} 
                      alt={p.name} 
                      className="table-product-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`image-placeholder ${p.image ? 'hidden' : ''}`}
                  >
                    {p.name ? p.name.substring(0, 8) : 'No Image'}
                  </div>
                </td>
                <td className="table-body-cell">
                  <div className="table-product-info">
                    <div className="table-product-name">{p.name}</div>
                    {p.featured && <span className="featured-badge">★ Featured</span>}
                  </div>
                </td>
                <td className="table-body-cell">{categories.find(c => c.category_id === p.category_id)?.name || 'N/A'}</td>
                <td className="table-body-cell">
                  <div className="price-display">
                    <div className="base-price">Base: {formatBasePrice(p.price, currency)}</div>
                    <div className="final-price">Final: {formatPriceWithTax(p.price, currency, vat_rate)}</div>
                  </div>
                </td>
                <td className="table-body-cell">
                  <div className="table-stock-info">
                    <div className="table-stock-quantity">{p.stock || 0}</div>
                    <div className={`table-stock-indicator ${getStockLevel(p.stock || 0).class}`}>
                      {getStockLevel(p.stock || 0).text}
                    </div>
                  </div>
                </td>
                <td className="table-body-cell">
                  <span className={`table-status-badge ${p.is_active ? 'table-status-active' : 'table-status-inactive'}`}>
                    {p.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </td>
                <td className="table-body-cell">
                  <div className="table-actions">
                    <button onClick={() => handleOpenModalForEdit(p)} className="table-action-btn table-edit-btn">✏️</button>
                    {p.is_active ? (
                      <button onClick={() => handleDeleteProduct(p.product_id)} className="table-action-btn table-delete-btn" title="Deactivate">🗑️</button>
                    ) : (
                      <button onClick={() => handleRestoreProduct(p.product_id)} className="table-action-btn table-view-btn" title="Restore">🔄</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="7" className="table-body-cell no-products-message">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={handlePageChange}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={editingProduct}
        suppliers={suppliers}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default ProductManager;
