import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaEnvelope, FaPhone, FaCity, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

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

  const token = localStorage.getItem('token');

  // Load products, suppliers, categories, settings, and currencies
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [productsRes, suppliersRes, categoriesRes, settingsRes, currenciesRes] = await Promise.all([
          axios.get('/api/products'),
          axios.get('/api/suppliers', { headers }),
          axios.get('/api/categories', { headers }),
          axios.get('/api/settings'),
          axios.get('/api/currencies'),
        ]);
        setProducts(productsRes.data);
        setSuppliers(suppliersRes.data);
        setCategories(categoriesRes.data);
        setSettings(settingsRes.data);
        setCurrencies(currenciesRes.data);
      } catch (err) {
        console.error('Error fetching initial product data:', err);
        setMessage('Failed to load products, suppliers, categories, or settings.');
      }
    };

    if (token) {
      fetchProductData();
    } else {
      setMessage('Authentication token missing. Please log in as an administrator.');
    }
  }, [token]);

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
        const uploadRes = await axios.post('/api/upload-image', data, {
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
        const uploadRes = await axios.post('/api/upload-image', data, {
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
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const res = await axios.delete(`/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(res.data.message);
        // Reload products after deleting
        const updated = await axios.get('/api/products');
        setProducts(updated.data);
      } catch (err) {
        setMessage(err.response?.data?.message || 'Error deleting product');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase())) // Assuming category_name exists
  );

  // Add a formatPrice function
  const formatPrice = (price) => {
    const currency = currencies[settings.currency];
    if (!currency) return `₪${parseFloat(price).toFixed(2)}`;
    const convertedPrice = price * currency.rate;
    return `${currency.symbol}${convertedPrice.toFixed(2)}`;
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
          onClick={() => { setShowAddForm(!showAddForm); setEditingProduct(null); setForm({ name: '', description: '', price: '', stock: '', image: '', supplier_id: '', category_id: '' }); setImageFile(null); setImagePreview(''); setMessage(''); }}
        >
          {showAddForm ? 'Cancel' : 'Add New Product'}
        </button>
      </div>

      {showAddForm && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={editingProduct ? handleUpdateProduct : handleSubmit}>
            <div style={{ marginBottom: '10px' }}>
              <input name="name" placeholder="name" value={form.name} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} /> <span style={{color:'red'}}>*</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input name="description" placeholder="description" value={form.description} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} /> <span style={{color:'red'}}>*</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input name="price" placeholder="price" type="number" value={form.price} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} /> <span style={{color:'red'}}>*</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input name="stock" placeholder="stock" type="number" value={form.stock} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} /> <span style={{color:'red'}}>*</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Image File: <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '4px' }} /></label><br />
              <label>or Image URL: <input name="image" placeholder="Image URL" value={form.image} onChange={handleImageUrlChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} /></label> <span style={{color:'red'}}>*</span>
              {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, margin: '10px 0' }} />}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Supplier:
                <select name="supplier_id" value={form.supplier_id} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="">Select supplier</option>
                  {suppliers.map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>{s.name || s.supplier_id}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Category:
                <select name="category_id" value={form.category_id} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.name || c.category_id}</option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Add Product</button>
          </form>
          <p style={{ marginTop: '10px', color: message === 'Product added successfully' ? 'green' : 'red' }}>{message}</p>
        </div>
      )}

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
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.product_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>
                  {p.image && <img src={p.image.startsWith('/uploads') ? `http://localhost:3001${p.image}` : p.image} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }} />}
                </td>
                <td style={{ padding: '15px' }}>
                  {p.name}
                  {p.featured && <span style={{ marginLeft: '5px', color: 'gold' }}>★ Featured</span>}
                </td>
                <td style={{ padding: '15px' }}>{categories.find(c => c.category_id === p.category_id)?.name || 'N/A'}</td>
                <td style={{ padding: '15px' }}>{formatPrice(parseFloat(p.price))}</td>
                <td style={{ padding: '15px', color: p.stock < 10 ? 'orange' : 'green' }}>{p.stock}</td>
                <td style={{ padding: '15px' }}>
                  <button onClick={() => handleEditProduct(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>✏️</button>
                  <button onClick={() => handleDeleteProduct(p.product_id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductManager;
