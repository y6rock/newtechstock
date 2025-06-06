import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProductManager() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', image: '', supplier_id: '', category_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);

  const token = localStorage.getItem('token');

  // Load products, suppliers, and categories
  useEffect(() => {
    axios.get('http://localhost:3001/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
    axios.get('http://localhost:3001/api/suppliers')
      .then(res => setSuppliers(res.data))
      .catch(err => console.error(err));
    axios.get('http://localhost:3001/api/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

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
    // Basic validation
    if (!form.name || !form.description || !form.price || !form.stock || (!form.image && !imageFile)) {
      setMessage('Please fill in all required fields, and provide an image file or URL.');
      return;
    }
    if (!token) {
      setMessage('You must be logged in to upload images. Please log in and try again.');
      return;
    }
    let imageUrl = form.image;
    if (imageFile) {
      // Upload image file to backend
      const data = new FormData();
      data.append('image', imageFile);
      try {
        const uploadRes = await axios.post('http://localhost:3001/api/upload-image', data, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        imageUrl = uploadRes.data.imageUrl;
      } catch (err) {
        setMessage('Image upload failed');
        return;
      }
    }
    try {
      const res = await axios.post('http://localhost:3001/api/products', {
        ...form,
        image: imageUrl,
        supplier_id: form.supplier_id || null,
        category_id: form.category_id || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message);
      // Reload products after adding
      const updated = await axios.get('http://localhost:3001/api/products');
      setProducts(updated.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error adding product');
    }
  };

  return (
    <div>
      <h2>Product Manager</h2>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="name" onChange={handleChange} /> <span style={{color:'red'}}>*</span><br />
        <input name="description" placeholder="description" onChange={handleChange} /> <span style={{color:'red'}}>*</span><br />
        <input name="price" placeholder="price" type="number" onChange={handleChange} /> <span style={{color:'red'}}>*</span><br />
        <input name="stock" placeholder="stock" type="number" onChange={handleChange} /> <span style={{color:'red'}}>*</span><br />
        {/* Image upload or URL */}
        <div>
          <label>Image File: <input type="file" accept="image/*" onChange={handleImageFileChange} /></label><br />
          <label>or Image URL: <input name="image" placeholder="Image URL" value={form.image} onChange={handleImageUrlChange} /></label> <span style={{color:'red'}}>*</span><br />
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, margin: '10px 0' }} />}
        </div>
        {/* Supplier dropdown */}
        <label>Supplier:
          <select name="supplier_id" value={form.supplier_id} onChange={handleChange} required>
            <option value="">Select supplier</option>
            {suppliers.map(s => (
              <option key={s.supplier_id} value={s.supplier_id}>{s.name || s.supplier_id}</option>
            ))}
          </select>
        </label><br />
        {/* Category dropdown */}
        <label>Category:
          <select name="category_id" value={form.category_id} onChange={handleChange} required>
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.name || c.category_id}</option>
            ))}
          </select>
        </label><br />
        <button type="submit">Add Product</button>
      </form>

      <p>{message}</p>

      <h3>Products List</h3>
      <ul>
        {products.map(p => (
          <li key={p.product_id}>
            {p.name} - ${p.price} - stock: {p.stock}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductManager;
