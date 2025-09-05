import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

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

      {/* Filter and Add Button */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label htmlFor="status-filter" style={{ fontWeight: '600', color: '#555' }}>Filter by Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff' }}
            >
              <option value="all">All Categories ({categories.length})</option>
              <option value="active">Active ({categories.filter(c => c.status === 'Active').length})</option>
              <option value="inactive">Inactive ({categories.filter(c => c.status === 'Inactive').length})</option>
            </select>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            + Add New Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>ID</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No categories found.</td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.category_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>{category.category_id}</td>
                  <td style={{ padding: '15px' }}>{category.name}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.85em',
                      backgroundColor: category.status === 'Active' ? '#d4edda' : '#f8d7da',
                      color: category.status === 'Active' ? '#155724' : '#721c24'
                    }}>
                      {category.status}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => handleEditCategory(category)} style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Edit</button>
                      <button 
                        onClick={() => handleToggleStatus(category.category_id, category.status)} 
                        style={{ 
                          padding: '8px 12px', 
                          backgroundColor: category.status === 'Active' ? '#dc3545' : '#28a745', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '5px', 
                          cursor: 'pointer' 
                        }}
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

      {/* Add Category Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: '0', marginBottom: '20px', color: '#333' }}>Add New Category</h2>
            
            {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
            
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>Category Name:</label>
                <input
                  type="text"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={handleCloseAddModal}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#6c757d', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#007bff', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer' 
                  }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: '0', marginBottom: '20px', color: '#333' }}>Edit Category</h2>
            
            {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
            
            <form onSubmit={handleUpdateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>Category Name:</label>
                <input
                  type="text"
                  value={editedCategoryName}
                  onChange={(e) => setEditedCategoryName(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={handleCloseEditModal}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#6c757d', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#007bff', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer' 
                  }}
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