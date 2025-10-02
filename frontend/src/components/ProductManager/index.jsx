import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductModal from '../ProductModal';
import Pagination from '../Pagination';
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('stock');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const { isUserAdmin, loadingSettings, currency, vat_rate } = useSettings();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem('token');
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Stock level indicator function
  const getStockLevel = (stock) => {
    if (stock <= 0) return { level: 'out', class: 'stock-out-of-stock', text: 'OUT OF STOCK' };
    if (stock <= 10) return { level: 'low', class: 'stock-low-stock', text: 'LOW STOCK' };
    if (stock <= 20) return { level: 'medium', class: 'stock-medium-stock', text: 'MEDIUM STOCK' };
    return { level: 'high', class: 'stock-high-stock', text: 'HIGH STOCK' };
  };

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const fetchProductData = useCallback(async (page = 1, search = '') => {
    if (loadingSettings || !isUserAdmin) {
      if (!loadingSettings && !isUserAdmin) navigate('/');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }
      
      const [productsRes, suppliersRes, categoriesRes] = await Promise.all([
        fetch(`/api/products/admin/all?${params}`, { headers }),
        fetch('/api/suppliers', { headers }),
        fetch('/api/categories', { headers })
      ]);

      if (!productsRes.ok || !suppliersRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch initial product data.');
      }

      const productsData = await productsRes.json();
      const suppliersData = await suppliersRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData.products || productsData);
      setSuppliers(suppliersData.suppliers || suppliersData);
      setCategories(categoriesData.categories || categoriesData);
      
      if (productsData.pagination) {
        setPagination(productsData.pagination);
      }

    } catch (err) {
      console.error('Error fetching initial product data:', err);
      setError('Failed to load necessary data. Please try again.');
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  // Handle page changes
  const handlePageChange = useCallback((newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
    fetchProductData(newPage, searchTerm);
  }, [searchParams, setSearchParams, searchTerm, fetchProductData]);

  // Handle search term changes
  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    const params = new URLSearchParams();
    params.set('page', '1'); // Reset to first page on search
    if (newSearchTerm.trim()) {
      params.set('search', newSearchTerm);
    }
    setSearchParams(params);
  }, [setSearchParams]);

  useEffect(() => {
    const currentPage = parseInt(searchParams.get('page')) || 1;
    const currentSearch = searchParams.get('search') || '';
    setSearchTerm(currentSearch);
    fetchProductData(currentPage, currentSearch);
  }, [fetchProductData, searchParams]);

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
      const updated = await axios.get('/api/products');
      console.log('GET /api/products promise resolved. Re-fetched products data:', updated.data);
      setProducts(updated.data);
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
      const updated = await axios.get('/api/products/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProducts(updated.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to deactivate this product? It will be hidden from customers but can be restored later.')) {
      try {
        const res = await axios.delete(`/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Product deactivated successfully!');
        // Reload products after deactivating
        const updated = await axios.get('/api/products/admin/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(updated.data);
      } catch (err) {
        showError(err.response?.data?.message || 'Error deactivating product');
      }
    }
  };

  const handleRestoreProduct = async (productId) => {
    if (window.confirm('Are you sure you want to restore this product? It will be visible to customers again.')) {
      try {
        const res = await axios.patch(`/api/products/${productId}/restore`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Product restored successfully!');
        // Reload products after restoring
        const updated = await axios.get('/api/products/admin/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(updated.data);
      } catch (err) {
        showError(err.response?.data?.message || 'Error restoring product');
      }
    }
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

  const handleSuccess = async () => {
    handleCloseModal();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [productsRes, suppliersRes, categoriesRes] = await Promise.all([
        axios.get('/api/products/admin/all', { headers }),
        axios.get('/api/suppliers', { headers }),
        axios.get('/api/categories', { headers })
      ]);
      setProducts(productsRes.data.products || productsRes.data);
      setSuppliers(suppliersRes.data.suppliers || suppliersRes.data);
      setCategories(categoriesRes.data.categories || categoriesRes.data);
    } catch (err) {
      console.error('Error fetching product data after success:', err);
      setMessage('Product was added, but failed to refresh the list.');
    }
  };

  // Client-side sorting only (search handled by backend)
  const sortedProducts = [...products].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'category':
        aValue = categories.find(c => c.category_id === a.category_id)?.name || '';
        bValue = categories.find(c => c.category_id === b.category_id)?.name || '';
        break;
      case 'price':
        aValue = parseFloat(a.price) || 0;
        bValue = parseFloat(b.price) || 0;
        break;
      case 'stock':
        aValue = parseInt(a.stock) || 0;
        bValue = parseInt(b.stock) || 0;
        break;
      case 'supplier':
        aValue = suppliers.find(s => s.supplier_id === a.supplier_id)?.name || '';
        bValue = suppliers.find(s => s.supplier_id === b.supplier_id)?.name || '';
        break;
      default:
        aValue = a.stock || 0;
        bValue = b.stock || 0;
    }
    
    if (typeof aValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortDirection === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
  });

  return (
    <div className="product-manager-main-container">
      <h1 className="product-manager-title">Products</h1>
      <p className="product-manager-subtitle">Manage your product catalog</p>

      {/* Search and Filter Controls - Enhanced Layout */}
      <div className="search-filter-controls">
        {/* Search Input */}
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input-field"
          />
          <span className="search-icon">
            🔍
          </span>
        </div>
        
        {/* Status Filter */}
        <div className="status-filter-container">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter-select"
          >
            <option value="all">All Products ({products.length})</option>
            <option value="active">Active ({products.filter(p => p.is_active === 1).length})</option>
            <option value="inactive">Inactive ({products.filter(p => p.is_active === 0).length})</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="category-filter-container">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
            onChange={(e) => setSupplierFilter(e.target.value)}
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
          <span>Showing {sortedProducts.length} of {products.length} products</span>
          {(statusFilter !== 'all' || categoryFilter !== 'all' || supplierFilter !== 'all' || searchTerm) && (
            <button 
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setSupplierFilter('all');
                setSearchTerm('');
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
            {products.length}
          </div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-active">
            {products.filter(p => p.is_active === 1).length}
          </div>
          <div className="stat-label">Active Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value-inactive">
            {products.filter(p => p.is_active === 0).length}
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
                className={`sortable-header ${sortField === 'name' ? sortDirection : ''}`}
                onClick={() => handleSort('name')}
                className="table-header-cell"
              >
                Name
              </th>
              <th 
                className={`sortable-header ${sortField === 'category' ? sortDirection : ''}`}
                onClick={() => handleSort('category')}
                className="table-header-cell"
              >
                Category
              </th>
              <th 
                className={`sortable-header ${sortField === 'price' ? sortDirection : ''}`}
                onClick={() => handleSort('price')}
                className="table-header-cell"
              >
                Price (Base / Final)
              </th>
              <th 
                className={`sortable-header ${sortField === 'stock' ? sortDirection : ''}`}
                onClick={() => handleSort('stock')}
                className="table-header-cell"
              >
                Stock
              </th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map(p => (
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
            {sortedProducts.length === 0 && (
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
