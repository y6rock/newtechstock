import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Pagination from '../../../components/Pagination';
import './Categories.css';

const Categories = () => {
  const { isUserAdmin, loadingSettings } = useSettings();
  const { showSuccess, showError, showConfirm } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [newCategoryImagePreview, setNewCategoryImagePreview] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null); // category object being edited
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [editedCategoryDescription, setEditedCategoryDescription] = useState('');
  const [editedCategoryImage, setEditedCategoryImage] = useState(null);
  const [editedCategoryImagePreview, setEditedCategoryImagePreview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Fetch categories function
  const fetchCategories = useCallback(async (searchQuery = '', page = 1) => {
    try {
      setLoadingCategories(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      const response = await fetch(`/api/categories?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const categoriesData = data.categories || data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (loadingSettings) {
      return; // Wait for settings to load
    }
    if (!isUserAdmin) {
      navigate('/'); // Redirect if not admin
      return;
    }

    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    setSearchTerm(search);
    fetchCategories(search, page);
  }, [isUserAdmin, loadingSettings, navigate, searchParams, fetchCategories]);

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
    fetchCategories(searchTerm, newPage);
  }, [searchParams, setSearchParams, searchTerm, fetchCategories]);

  // Handle search changes with debouncing - only updates state, not URL
  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    // Don't update URL params here - let the debounced effect handle it
    // This prevents the input from losing focus on every keystroke
  }, []);

  // Debounced search effect - optimized to prevent input focus loss
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isUserAdmin && searchTerm.trim()) {
        // Only perform search if there's actually a search term
        fetchCategories(searchTerm, 1);
      } else if (isUserAdmin && !searchTerm.trim()) {
        // Clear search - fetch all categories
        fetchCategories('', 1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, isUserAdmin, fetchCategories]);


  // Client-side filtering disabled - using server-side pagination instead
  // useEffect(() => {
  //   let filtered = categories;
  //   
  //   // Apply status filter
  //   if (statusFilter === 'active') {
  //     filtered = filtered.filter(category => category.status === 'Active');
  //   } else if (statusFilter === 'inactive') {
  //     filtered = filtered.filter(category => category.status === 'Inactive');
  //   }
  //   
  //   // Apply search filter
  //   if (searchTerm.trim()) {
  //     filtered = filtered.filter(category =>
  //       category.name.toLowerCase().includes(searchTerm.toLowerCase())
  //     );
  //   }
  //   
  //   // Apply sorting
  //   const sortedFiltered = sortCategories(filtered);
  //   setFilteredCategories(sortedFiltered);
  // }, [categories, statusFilter, searchTerm, sortField, sortDirection]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', newCategoryName);
      formData.append('description', newCategoryDescription);
      if (newCategoryImage) {
        formData.append('image', newCategoryImage);
      }
      
      await axios.post('/api/categories', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryImage(null);
      setNewCategoryImagePreview(null);
      setShowAddModal(false);
      setError(null);
      const currentPage = searchParams.get('page') || 1;
      const currentSearch = searchParams.get('search') || '';
      fetchCategories(currentSearch, currentPage);
      showSuccess('Category added successfully!');
    } catch (err) {
      console.error('Error adding category:', err);
      showError(err.response?.data?.message || 'Failed to add category.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditedCategoryName(category.name);
    setEditedCategoryDescription(category.description || '');
    setEditedCategoryImage(null);
    setEditedCategoryImagePreview(category.image || null);
    setShowEditModal(true);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editedCategoryName.trim()) {
      showError('Category name cannot be empty.');
      return;
    }
    if (!editingCategory) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', editedCategoryName);
      formData.append('description', editedCategoryDescription);
      if (editedCategoryImage) {
        formData.append('image', editedCategoryImage);
      } else if (editedCategoryImagePreview && !editedCategoryImage) {
        // Keep existing image
        formData.append('image', editedCategoryImagePreview);
      }
      
      await axios.put(`/api/categories/${editingCategory.category_id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setEditingCategory(null);
      setEditedCategoryName('');
      setEditedCategoryDescription('');
      setEditedCategoryImage(null);
      setEditedCategoryImagePreview(null);
      setShowEditModal(false);
      setError(null);
      showSuccess('Category updated successfully!');
      const currentPage = searchParams.get('page') || 1;
      const currentSearch = searchParams.get('search') || '';
      fetchCategories(currentSearch, currentPage);
    } catch (err) {
      console.error('Error updating category:', err);
      showError(err.response?.data?.message || 'Failed to update category.');
    }
  };

  const handleCloseEditModal = () => {
    setEditingCategory(null);
    setEditedCategoryName('');
    setEditedCategoryDescription('');
    setEditedCategoryImage(null);
    setEditedCategoryImagePreview(null);
    setShowEditModal(false);
    setError(null);
  };

  const handleCloseAddModal = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryImage(null);
    setNewCategoryImagePreview(null);
    setShowAddModal(false);
    setError(null);
  };

  const handleNewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCategoryImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setNewCategoryImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditedCategoryImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setEditedCategoryImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    showConfirm(
      'Are you sure you want to deactivate this category? It will no longer be visible to customers but can be restored later.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`/api/categories/${categoryId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentPage = searchParams.get('page') || 1;
          const currentSearch = searchParams.get('search') || '';
          fetchCategories(currentPage, currentSearch);
          showSuccess('Category deactivated successfully!');
        } catch (err) {
          console.error('Error deactivating category:', err);
          showError(err.response?.data?.message || 'Failed to deactivate category.');
        }
      },
      () => {
        // Cancel callback - do nothing
      }
    );
  };

  const handleRestoreCategory = async (categoryId) => {
    showConfirm(
      'Are you sure you want to restore this category? It will be visible to customers again.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.patch(`/api/categories/${categoryId}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentPage = searchParams.get('page') || 1;
          const currentSearch = searchParams.get('search') || '';
          fetchCategories(currentPage, currentSearch);
          showSuccess('Category restored successfully!');
        } catch (err) {
          console.error('Error restoring category:', err);
          showError(err.response?.data?.message || 'Failed to restore category.');
        }
      },
      () => {
        // Cancel callback - do nothing
      }
    );
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    const action = currentStatus === 'Active' ? 'deactivate' : 'activate';
    showConfirm(
      `Are you sure you want to ${action} this category?`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.patch(`/api/categories/${categoryId}/toggle-status`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentPage = searchParams.get('page') || 1;
          const currentSearch = searchParams.get('search') || '';
          fetchCategories(currentPage, currentSearch);
          showSuccess(`Category ${action}d successfully!`);
        } catch (err) {
          console.error('Error toggling category status:', err);
          showError(err.response?.data?.message || 'Failed to toggle category status.');
        }
      },
      () => {
        // Cancel callback - do nothing
      }
    );
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
            <div className="search-filter-group">
              <label className="filter-label">Search Categories</label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search categories by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              {searchTerm && (
                <div className="search-results-count">
                  {pagination.totalItems} categor{pagination.totalItems !== 1 ? 'ies' : 'y'} found
                </div>
              )}
            </div>
            
            <div className="status-filter-group">
              <label htmlFor="status-filter" className="filter-label">Filter by Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories ({pagination.totalItems})</option>
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
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-categories">No categories found.</td>
              </tr>
            ) : (
              categories.map((category) => (
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
      
      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        onPageChange={handlePageChange}
      />
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

              <div className="form-group">
                <label className="form-label">Description:</label>
                <textarea
                  placeholder="Enter category description (optional)"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="form-input form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewImageChange}
                  className="form-input file-input"
                />
                {newCategoryImagePreview && (
                  <div className="image-preview-container">
                    <img src={newCategoryImagePreview} alt="Category Preview" className="image-preview" />
                  </div>
                )}
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

              <div className="form-group">
                <label className="form-label">Description:</label>
                <textarea
                  placeholder="Enter category description (optional)"
                  value={editedCategoryDescription}
                  onChange={(e) => setEditedCategoryDescription(e.target.value)}
                  className="form-input form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="form-input file-input"
                />
                {editedCategoryImagePreview && (
                  <div className="image-preview-container">
                    <img src={editedCategoryImagePreview} alt="Category Preview" className="image-preview" />
                  </div>
                )}
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
