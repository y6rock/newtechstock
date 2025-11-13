import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../../components/Pagination/Pagination';
import './Categories.css';

const Categories = () => {
  const { isUserAdmin, loadingSettings } = useSettings();
  const { showSuccess, showError, showConfirm } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  
  // Sorting and filtering state
  const [sortConfig, setSortConfig] = useState({ field: 'category_id', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
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

  // Auto-refocus search input after re-renders to maintain typing experience
  useEffect(() => {
    if (searchInputRef.current && searchTerm) {
      searchInputRef.current.focus();
    }
  });

  // Fetch categories function - reusable
  const fetchCategories = useCallback(async (pageOverride = null) => {
    try {
      setLoadingCategories(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const pageToUse = pageOverride !== null ? pageOverride : pagination.currentPage;
      const params = new URLSearchParams({
        page: pageToUse.toString(),
        limit: '10'
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      // Add sorting
      if (sortConfig?.field) {
        params.append('sortField', mapToApiSortField(sortConfig.field));
        params.append('sortDirection', sortConfig.direction);
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
  }, [searchTerm, statusFilter, pagination.currentPage, sortConfig]);

  // Ref-based search implementation - no re-renders during typing
  useEffect(() => {
    if (!isUserAdmin || loadingSettings) {
      if (!loadingSettings && !isUserAdmin) {
        navigate('/');
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchCategories();
    }, searchTerm.trim() ? 300 : 0); // Debounce only when searching

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, isUserAdmin, loadingSettings, navigate, sortConfig, fetchCategories]);

  // Handle page changes
  const handlePageChange = useCallback(async (newPage) => {
    await fetchCategories(newPage);
  }, [fetchCategories]);

  // Handle search input changes - simple state update like Customers
  const handleSearchChange = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1 on search
  }, []);
  
  // Handle status filter changes
  const handleStatusFilterChange = useCallback((newStatus) => {
    setStatusFilter(newStatus);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1 on filter change
  }, []);


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
      
      const res = await axios.post('/api/categories', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Backend returns category_id in response
      const categoryId = res?.data?.category_id;
      if (!categoryId || categoryId < 0) {
        // If no valid ID returned, refetch the list to get the actual category from DB
        showError('Category added but ID not received. Refreshing list...');
        await fetchCategories();
        setNewCategoryName('');
        setNewCategoryDescription('');
        setNewCategoryImage(null);
        setNewCategoryImagePreview(null);
        setShowAddModal(false);
        setError(null);
        return;
      }
      
      // Optimistically update list with created category
      const created = {
        category_id: categoryId,
        name: newCategoryName,
        description: newCategoryDescription,
        image: newCategoryImagePreview || res?.data?.image || null,
        isActive: 1,
        status: 'Active'
      };
      setCategories(prev => [created, ...prev]);
      setPagination(prev => ({ ...prev, totalItems: (prev.totalItems || 0) + 1 }));

      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryImage(null);
      setNewCategoryImagePreview(null);
      setShowAddModal(false);
      setError(null);
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
      
      const res = await axios.put(`/api/categories/${editingCategory.category_id}`, formData, {
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
      // Update the row in local state immediately
      const updated = res?.data?.category || {
        ...editingCategory,
        name: editedCategoryName,
        description: editedCategoryDescription,
        image: editedCategoryImagePreview
      };
      setCategories(prev => prev.map(c => (c.category_id === updated.category_id ? { ...c, ...updated } : c)));
      showSuccess('Category updated successfully!');
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
          // Refresh the data after deactivation
          handlePageChange(pagination.currentPage);
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
          // Refresh the data after restoration
          handlePageChange(pagination.currentPage);
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
          
          // Update the category status immediately in the local state
          setCategories(prevCategories => 
            prevCategories.map(cat => 
              cat.category_id === categoryId 
                ? { ...cat, status: currentStatus === 'Active' ? 'Inactive' : 'Active' }
                : cat
            )
          );
          
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

  // Map UI field to API field
  const mapToApiSortField = (field) => {
    if (field === 'status') return 'status';
    return field;
  };

  // Handle column sorting (server-side)
  const handleSort = (field) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        return { field, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { field, direction: 'asc' };
      }
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  if (!isUserAdmin) {
    return null; // Should redirect, but return null just in case
  }
  const isLoading = loadingSettings || loadingCategories;

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h1 className="categories-title">Manage Categories</h1>
        <p className="categories-subtitle">Add, edit, or delete product categories.</p>
        {isLoading && (
          <div className="categories-loading" style={{ marginBottom: '10px' }}>Loading...</div>
        )}
        
        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-controls">
            <div className="search-filter-group">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search categories by name..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  ref={searchInputRef}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '14px 20px 14px 45px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '12px',
                    fontSize: '16px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '16px',
                  pointerEvents: 'none'
                }}>🔍</span>
              </div>
              {searchTerm && (
                <div className="search-results-count">
                  {pagination.totalItems} categor{pagination.totalItems !== 1 ? 'ies' : 'y'} found
                </div>
              )}
              
              {/* Status Filter - Under Search Field */}
              <div className="status-filters" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button 
                  className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('all')}
                >
                  All ({pagination.totalItems})
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('active')}
                >
                  Active
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
                  onClick={() => handleStatusFilterChange('inactive')}
                >
                  Inactive
                </button>
              </div>
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
              <th 
                className={`sortable ${sortConfig.field === 'category_id' ? 'active' : ''}`}
                onClick={() => handleSort('category_id')}
              >
                ID
                <span className="sort-arrow">
                  {sortConfig.field === 'category_id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortConfig.field === 'name' ? 'active' : ''}`}
                onClick={() => handleSort('name')}
              >
                Name
                <span className="sort-arrow">
                  {sortConfig.field === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable status-cell ${sortConfig.field === 'status' ? 'active' : ''}`}
                onClick={() => handleSort('status')}
              >
                Status
                <span className="sort-arrow">
                  {sortConfig.field === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
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
