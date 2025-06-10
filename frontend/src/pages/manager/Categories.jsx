import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

const Categories = () => {
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null); // category object being edited
  const [editedCategoryName, setEditedCategoryName] = useState('');

  useEffect(() => {
    if (loadingSettings) {
      return; // Wait for settings to load
    }
    if (!isUserAdmin) {
      navigate('/'); // Redirect if not admin
      return;
    }

    fetchCategories();
  }, [isUserAdmin, loadingSettings, navigate]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/categories', { name: newCategoryName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.message || 'Failed to add category.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditedCategoryName(category.name);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editedCategoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    if (!editingCategory) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/categories/${editingCategory.category_id}`, { name: editedCategoryName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingCategory(null);
      setEditedCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.message || 'Failed to update category.');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories();
      } catch (err) {
        console.error('Error deleting category:', err);
        setError(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  if (loadingSettings || loadingCategories) {
    return <div style={{ flex: 1, padding: '20px', textAlign: 'center' }}>Loading Admin Panel...</div>;
  }

  if (!isUserAdmin) {
    return null; // Should redirect, but return null just in case
  }

  return (
    <div style={{ flex: 1, padding: '20px' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '10px' }}>Manage Categories</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>Add, edit, or delete product categories.</p>

      {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

      {/* Add New Category Form */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
        <h3 style={{ marginTop: '0', marginBottom: '15px' }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
        <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Category Name"
            value={editingCategory ? editedCategoryName : newCategoryName}
            onChange={(e) => editingCategory ? setEditedCategoryName(e.target.value) : setNewCategoryName(e.target.value)}
            style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            required
          />
          <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {editingCategory ? 'Update Category' : 'Add Category'}
          </button>
          {editingCategory && (
            <button type="button" onClick={() => { setEditingCategory(null); setNewCategoryName(''); setError(null); }} style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      {/* Categories List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>ID</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No categories found.</td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.category_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>{category.category_id}</td>
                  <td style={{ padding: '15px' }}>{category.name}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button onClick={() => handleEditCategory(category)} style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handleDeleteCategory(category.category_id)} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Categories; 