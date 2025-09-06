import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import './Categories.css';

const Categories = () => {
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null); // category object being edited
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

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

  // Filter categories based on status
  useEffect(() => {
    let filtered = categories;
    
    if (statusFilter === 'active') {
      filtered = categories.filter(category => category.status === 'Active');
    } else if (statusFilter === 'inactive') {
      filtered = categories.filter(category => category.status === 'Inactive');
    }
    
    setFilteredCategories(filtered);
  }, [categories, statusFilter]);

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
      setShowAddModal(false);
      setError(null);
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.message || 'Failed to add category.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditedCategoryName(category.name);
    setShowEditModal(true);
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
      setShowEditModal(false);
      setError(null);
      fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.message || 'Failed to update category.');
    }
  };

  const handleCloseEditModal = () => {
    setEditingCategory(null);
    setEditedCategoryName('');
    setShowEditModal(false);
    setError(null);
  };

  const handleCloseAddModal = () => {
    setNewCategoryName('');
    setShowAddModal(false);
    setError(null);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to deactivate this category? It will no longer be visible to customers but can be restored later.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories();
      } catch (err) {
        console.error('Error deactivating category:', err);
        setError(err.response?.data?.message || 'Failed to deactivate category.');
      }
    }
  };

  const handleRestoreCategory = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/categories/${categoryId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) {
      console.error('Error restoring category:', err);
      setError(err.response?.data?.message || 'Failed to restore category.');
    }
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    const action = currentStatus === 'Active' ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this category?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(`/api/categories/${categoryId}/toggle-status`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories();
      } catch (err) {
        console.error('Error toggling category status:', err);
        setError(err.response?.data?.message || 'Failed to toggle category status.');
      }
    }
  };

  if (loadingSettings || loadingCategories) {
    return <div className="categories-loading">Loading Admin Panel...</div>;
  }

  if (!isUserAdmin) {
    return null; // Should redirect, but return null just in case
  }

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h1 className="categories-title">Manage Categories</h1>
        <p className="categories-subtitle">Add, edit, or delete product categories.</p>
        
        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="status-filter" className="filter-label">Filter by Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories ({categories.length})</option>
                <option value="active">Active ({categories.filter(c => c.status === 'Active').length})</option>
                <option value="inactive">Inactive ({categories.filter(c => c.status === 'Inactive').length})</option>
              </select>
            </div>
          </div>
          
          {/* Add Category Button */}
          <div className="add-button-container">
            <button 
              onClick={() => setShowAddModal(true)}
              className="add-category-btn"
            >
              + Add New Category
            </button>
          </div>

          {error && <p className="categories-error">{error}</p>}

          {/* Categories Table */}
          <div className="table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th className="status-cell">Status</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-categories">No categories found.</td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.category_id}>
                  <td>{category.category_id}</td>
                  <td>{category.name}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${category.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                      {category.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button onClick={() => handleEditCategory(category)} className="action-btn edit-btn">Edit</button>
                      <button 
                        onClick={() => handleToggleStatus(category.category_id, category.status)} 
                        className={`toggle-btn ${category.status === 'Active' ? 'toggle-deactivate' : 'toggle-activate'}`}
                      >
                        {category.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Add New Category</h2>
            
            {error && <p className="modal-error">{error}</p>}
            
            <form onSubmit={handleAddCategory} className="modal-form">
              <div className="form-group">
                <label className="form-label">Category Name:</label>
                <input
                  type="text"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-buttons">
                <button 
                  type="button" 
                  onClick={handleCloseAddModal}
                  className="form-btn cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="form-btn submit-btn"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Edit Category</h2>
            
            {error && <p className="modal-error">{error}</p>}
            
            <form onSubmit={handleUpdateCategory} className="modal-form">
              <div className="form-group">
                <label className="form-label">Category Name:</label>
                <input
                  type="text"
                  value={editedCategoryName}
                  onChange={(e) => setEditedCategoryName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-buttons">
                <button 
                  type="button" 
                  onClick={handleCloseEditModal}
                  className="form-btn cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="form-btn submit-btn"
                >
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories; 