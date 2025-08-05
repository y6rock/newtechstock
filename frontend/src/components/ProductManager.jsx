import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductModal from './ProductModal';
import { useSettings } from '../context/SettingsContext';

function ProductManager() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', image: '', supplier_id: '', category_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [settings, setSettings] = useState({ currency: 'ILS' });
  const [currencies, setCurrencies] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchProductData = useCallback(async () => {
    if (loadingSettings || !isUserAdmin) {
      if (!loadingSettings && !isUserAdmin) navigate('/');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [productsRes, suppliersRes, categoriesRes] = await Promise.all([
        fetch('/api/products/admin/all', { headers }), // Get all products including inactive
        fetch('/api/suppliers', { headers }), // Assuming this exists and requires auth
        fetch('/api/categories', { headers })
      ]);

      if (!productsRes.ok || !suppliersRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch initial product data.');
      }

      const productsData = await productsRes.json();
      const suppliersData = await suppliersRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData);
      setSuppliers(suppliersData);
      setCategories(categoriesData);

    } catch (err) {
      console.error('Error fetching initial product data:', err);
      setError('Failed to load necessary data. Please try again.');
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

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
      const res = await axios.put(`/api/products/${editingProduct.product_id}`, {
        ...form,
        image: imageUrl,
        supplier_id: form.supplier_id || null,
        category_id: form.category_id || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message);
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', stock: '', image: '', supplier_id: '', category_id: '' });
      setImageFile(null);
      setImagePreview('');
      setShowAddForm(false);
      // Reload products after updating
      const updated = await axios.get('/api/products');
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
        setMessage(res.data.message);
        // Reload products after deactivating
        const updated = await axios.get('/api/products/admin/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(updated.data);
      } catch (err) {
        setMessage(err.response?.data?.message || 'Error deactivating product');
      }
    }
  };

  const handleRestoreProduct = async (productId) => {
    if (window.confirm('Are you sure you want to restore this product? It will be visible to customers again.')) {
      try {
        const res = await axios.patch(`/api/products/${productId}/restore`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(res.data.message);
        // Reload products after restoring
        const updated = await axios.get('/api/products/admin/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(updated.data);
      } catch (err) {
        setMessage(err.response?.data?.message || 'Error restoring product');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase())) // Assuming category_name exists
  );

  // Add a formatPrice function
  const formatPrice = (price) => {
    // Handle invalid or null price values
    if (!price || isNaN(price) || price === null || price === undefined) {
      return '$0.00';
    }
    
    const currency = currencies[settings.currency];
    if (!currency) {
      const amount = parseFloat(price).toFixed(2);
      const parts = amount.split('.');
      const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const formattedAmount = parts.length > 1 ? `${wholePart}.${parts[1]}` : wholePart;
      return `₪${formattedAmount}`;
    }
    
    const convertedPrice = price * currency.rate;
    const amount = convertedPrice.toFixed(2);
    const parts = amount.split('.');
    const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formattedAmount = parts.length > 1 ? `${wholePart}.${parts[1]}` : wholePart;
    
    return `${currency.symbol}${formattedAmount}`;
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
      const [productsRes, suppliersRes, categoriesRes, settingsRes, currenciesRes] = await Promise.all([
        axios.get('/api/products/admin/all', { headers }),
        axios.get('/api/suppliers', { headers }),
        axios.get('/api/categories', { headers }),
        axios.get('/api/settings'),
        axios.get('/api/settings/currencies'),
      ]);
      setProducts(productsRes.data);
      setSuppliers(suppliersRes.data);
      setCategories(categoriesRes.data);
      setSettings(settingsRes.data);
      setCurrencies(currenciesRes.data);
    } catch (err) {
      console.error('Error fetching product data after success:', err);
      setMessage('Product was added, but failed to refresh the list.');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2em', marginBottom: '10px' }}>Products</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>Manage your product catalog</p>

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 15px 10px 40px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '1em',
          }}
        />
        <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>
          🔍
        </span>
      </div>

      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <button
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', borderRadius: '5px', border: 'none', cursor: 'pointer' }}
          onClick={handleOpenModalForAdd}
        >
          Add New Product
        </button>
      </div>

      {message && <p>{message}</p>}

      <h3>Products List</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Image</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Category</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Price</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Inventory</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.product_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>
                  {p.image ? (
                    <img 
                                             src={p.image && p.image.startsWith('/uploads') ? `http://localhost:3001${p.image}` : p.image || 'https://via.placeholder.com/50'} 
                      alt={p.name} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div 
                    style={{ 
                      width: '50px', 
                      height: '50px', 
                      backgroundColor: '#f0f0f0', 
                      borderRadius: '5px', 
                      display: p.image ? 'none' : 'flex',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#666',
                      textAlign: 'center',
                      padding: '2px'
                    }}
                    className="image-placeholder"
                  >
                    {p.name ? p.name.substring(0, 8) : 'No Image'}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  {p.name}
                  {p.featured && <span style={{ marginLeft: '5px', color: 'gold' }}>★ Featured</span>}
                </td>
                <td style={{ padding: '15px' }}>{categories.find(c => c.category_id === p.category_id)?.name || 'N/A'}</td>
                <td style={{ padding: '15px' }}>{formatPrice(p.price)}</td>
                <td style={{ 
                  padding: '15px', 
                  color: p.stock < 0 ? 'red' : p.stock < 10 ? 'orange' : 'green',
                  fontWeight: p.stock < 0 ? 'bold' : 'normal'
                }}>
                  {p.stock < 0 ? `${p.stock} (OUT OF STOCK)` : p.stock}
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: p.is_active ? '#d4edda' : '#f8d7da',
                    color: p.is_active ? '#155724' : '#721c24'
                  }}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <button onClick={() => handleOpenModalForEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>✏️</button>
                  {p.is_active ? (
                    <button onClick={() => handleDeleteProduct(p.product_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }} title="Deactivate">🗑️</button>
                  ) : (
                    <button onClick={() => handleRestoreProduct(p.product_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }} title="Restore">🔄</button>
                  )}
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
