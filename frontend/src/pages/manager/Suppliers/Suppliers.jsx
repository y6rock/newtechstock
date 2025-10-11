import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Pagination from '../../../components/Pagination/Pagination';
import './Suppliers.css';

const Suppliers = () => {
  const { isUserAdmin, loadingSettings } = useSettings();
  const { showSuccess, showError, showConfirm } = useToast();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [sortField, setSortField] = useState('supplier_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [searchParams, setSearchParams] = useSearchParams();
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [editingSupplier, setEditingSupplier] = useState(null); // supplier object being edited
  const [editedSupplierName, setEditedSupplierName] = useState('');
  const [editedSupplierEmail, setEditedSupplierEmail] = useState('');
  const [editedSupplierPhone, setEditedSupplierPhone] = useState('');
  const [editedSupplierAddress, setEditedSupplierAddress] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch suppliers function
  const fetchSuppliers = useCallback(async (searchQuery = '', page = 1) => {
    try {
      setLoadingSuppliers(true);
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
      
      const response = await fetch(`/api/suppliers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSuppliers(data.suppliers || data);
      
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Failed to fetch suppliers');
    } finally {
      setLoadingSuppliers(false);
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
    fetchSuppliers(search, page);
  }, [isUserAdmin, loadingSettings, navigate, fetchSuppliers]);

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
    fetchSuppliers(searchTerm, newPage);
  }, [searchParams, setSearchParams, searchTerm, fetchSuppliers]);

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
        fetchSuppliers(searchTerm, 1);
      } else if (isUserAdmin && !searchTerm.trim()) {
        // Clear search - fetch all suppliers
        fetchSuppliers('', 1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, isUserAdmin]);

  // Sorting function
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort suppliers
  const sortSuppliers = (suppliersToSort) => {
    return [...suppliersToSort].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle different data types
      if (sortField === 'supplier_id') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (sortField === 'isActive') {
        aValue = a.isActive ? 1 : 0;
        bValue = b.isActive ? 1 : 0;
      } else if (typeof aValue === 'string') {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Client-side filtering disabled - using server-side pagination instead
  // useEffect(() => {
  //   let filtered = suppliers;
  //   
  //   // Apply status filter
  //   if (statusFilter === 'active') {
  //     filtered = filtered.filter(supplier => supplier.isActive === true);
  //   } else if (statusFilter === 'inactive') {
  //     filtered = filtered.filter(supplier => supplier.isActive === false);
  //   }
  //   
  //   // Apply search filter
  //   if (searchTerm.trim()) {
  //     filtered = filtered.filter(supplier =>
  //       supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
  //     );
  //   }
  //   
  //   // Apply sorting
  //   const sortedFiltered = sortSuppliers(filtered);
  //   setFilteredSuppliers(sortedFiltered);
  // }, [suppliers, statusFilter, searchTerm, sortField, sortDirection]);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierName.trim()) {
      setError('Supplier name cannot be empty.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/suppliers', { 
        name: newSupplierName, 
        email: newSupplierEmail, 
        phone: newSupplierPhone, 
        address: newSupplierAddress 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewSupplierName('');
      setNewSupplierEmail('');
      setNewSupplierPhone('');
      setNewSupplierAddress('');
      setShowAddModal(false);
      setError(null);
      const currentPage = searchParams.get('page') || 1;
      const currentSearch = searchParams.get('search') || '';
      fetchSuppliers(currentSearch, currentPage);
      showSuccess('Supplier added successfully!');
    } catch (err) {
      console.error('Error adding supplier:', err);
      showError(err.response?.data?.message || 'Failed to add supplier.');
    }
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setEditedSupplierName(supplier.name);
    setEditedSupplierEmail(supplier.email || '');
    setEditedSupplierPhone(supplier.phone || '');
    setEditedSupplierAddress(supplier.address || '');
    setShowEditModal(true);
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    if (!editedSupplierName.trim()) {
      setError('Supplier name cannot be empty.');
      return;
    }
    if (!editingSupplier) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/suppliers/${editingSupplier.supplier_id}`, { 
        name: editedSupplierName, 
        email: editedSupplierEmail, 
        phone: editedSupplierPhone, 
        address: editedSupplierAddress 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingSupplier(null);
      setEditedSupplierName('');
      setEditedSupplierEmail('');
      setEditedSupplierPhone('');
      setEditedSupplierAddress('');
      setShowEditModal(false);
      setError(null);
      const currentPage = searchParams.get('page') || 1;
      const currentSearch = searchParams.get('search') || '';
      fetchSuppliers(currentSearch, currentPage);
      showSuccess('Supplier updated successfully!');
    } catch (err) {
      console.error('Error updating supplier:', err);
      showError(err.response?.data?.message || 'Failed to update supplier.');
    }
  };

  const handleCloseEditModal = () => {
    setEditingSupplier(null);
    setEditedSupplierName('');
    setEditedSupplierEmail('');
    setEditedSupplierPhone('');
    setEditedSupplierAddress('');
    setShowEditModal(false);
    setError(null);
  };

  const handleCloseAddModal = () => {
    setNewSupplierName('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setNewSupplierAddress('');
    setShowAddModal(false);
    setError(null);
  };

  const handleDeleteSupplier = async (supplierId) => {
    showConfirm(
      'Are you sure you want to deactivate this supplier? It will no longer be visible to customers but can be restored later.',
      async () => {
        try {
          console.log('Attempting to delete supplier with ID:', supplierId);
          const token = localStorage.getItem('token');
          await axios.delete(`/api/suppliers/${supplierId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentPage = searchParams.get('page') || 1;
          const currentSearch = searchParams.get('search') || '';
          fetchSuppliers(currentSearch, currentPage);
          showSuccess('Supplier deactivated successfully!');
        } catch (err) {
          console.error('Error deleting supplier:', err);
          showError(err.response?.data?.message || 'Failed to deactivate supplier.');
        }
      }
    );
  };

  const handleRestoreSupplier = async (supplierId) => {
    showConfirm(
      'Are you sure you want to restore this supplier? It will be visible to customers again.',
      async () => {
        try {
          console.log('Attempting to restore supplier with ID:', supplierId);
          const token = localStorage.getItem('token');
          await axios.patch(`/api/suppliers/${supplierId}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentPage = searchParams.get('page') || 1;
          const currentSearch = searchParams.get('search') || '';
          fetchSuppliers(currentSearch, currentPage);
          showSuccess('Supplier restored successfully!');
        } catch (err) {
          console.error('Error restoring supplier:', err);
          showError(err.response?.data?.message || 'Failed to restore supplier.');
        }
      }
    );
  };

  if (loadingSettings || loadingSuppliers) {
    return <div className="suppliers-loading">Loading Admin Panel...</div>;
  }

  if (!isUserAdmin) {
    return null; // Should redirect, but return null just in case
  }

  return (
    <div className="suppliers-container">
      <h1 className="suppliers-title">Manage Suppliers</h1>
      <p className="suppliers-subtitle">Add, edit, or delete product suppliers.</p>
      
      {/* Add Supplier Button */}
      <div className="add-button-container">
        <button 
          onClick={() => setShowAddModal(true)}
          className="add-supplier-btn"
        >
          + Add New Supplier
        </button>
      </div>

      {error && <p className="suppliers-error">{error}</p>}

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-controls">
          <div className="search-filter-group">
            <label className="filter-label">Search Suppliers</label>
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search suppliers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            {searchTerm && (
              <div className="search-results-count">
                {pagination.totalItems} supplier{pagination.totalItems !== 1 ? 's' : ''} found
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
              <option value="all">All Suppliers ({suppliers.length})</option>
              <option value="active">Active ({suppliers.filter(s => s.isActive === true).length})</option>
              <option value="inactive">Inactive ({suppliers.filter(s => s.isActive === false).length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="table-container">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th 
                className={`sortable ${sortField === 'supplier_id' ? 'active' : ''}`}
                onClick={() => handleSort('supplier_id')}
              >
                ID
                <span className="sort-arrow">
                  {sortField === 'supplier_id' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortField === 'name' ? 'active' : ''}`}
                onClick={() => handleSort('name')}
              >
                Name
                <span className="sort-arrow">
                  {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortField === 'email' ? 'active' : ''}`}
                onClick={() => handleSort('email')}
              >
                Email
                <span className="sort-arrow">
                  {sortField === 'email' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortField === 'phone' ? 'active' : ''}`}
                onClick={() => handleSort('phone')}
              >
                Phone
                <span className="sort-arrow">
                  {sortField === 'phone' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortField === 'address' ? 'active' : ''}`}
                onClick={() => handleSort('address')}
              >
                Address
                <span className="sort-arrow">
                  {sortField === 'address' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th 
                className={`sortable ${sortField === 'isActive' ? 'active' : ''}`}
                onClick={() => handleSort('isActive')}
              >
                Status
                <span className="sort-arrow">
                  {sortField === 'isActive' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </span>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-suppliers">No suppliers found.</td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.supplier_id} className={supplier.isActive === 0 ? 'inactive-row' : ''}>
                  <td>{supplier.supplier_id}</td>
                  <td>{supplier.name}</td>
                  <td>{supplier.email || '-'}</td>
                  <td>{supplier.phone || '-'}</td>
                  <td className="address-cell">{supplier.address || '-'}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${supplier.isActive === 1 ? 'active' : 'inactive'}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {supplier.isActive === 1 ? (
                      <>
                        <button onClick={() => handleEditSupplier(supplier)} className="action-btn edit-btn">Edit</button>
                        <button onClick={() => handleDeleteSupplier(supplier.supplier_id)} className="action-btn delete-btn">Deactivate</button>
                      </>
                    ) : (
                      <button onClick={() => handleRestoreSupplier(supplier.supplier_id)} className="action-btn restore-btn">Restore</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">Add New Supplier</h2>
            
            {error && <p className="modal-error">{error}</p>}
            
            <form onSubmit={handleAddSupplier} className="modal-form">
              <div className="form-group">
                <label className="form-label">Supplier Name:</label>
                <input
                  type="text"
                  placeholder="Enter supplier name"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email:</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Phone:</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Address:</label>
                <textarea
                  placeholder="Enter address"
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  rows="3"
                  className="form-textarea"
                />
              </div>
              
              <div className="modal-buttons">
                <button 
                  type="button" 
                  onClick={handleCloseAddModal}
                  className="modal-button secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-button primary"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && (
        <div className="edit-modal-overlay">
          <div className="edit-modal-content">
            <h2 className="edit-modal-header">Edit Supplier</h2>
            
            {error && <p className="edit-modal-error">{error}</p>}
            
            <form onSubmit={handleUpdateSupplier} className="edit-modal-form">
              <div className="edit-form-group">
                <label className="edit-form-label">Supplier Name:</label>
                <input
                  type="text"
                  value={editedSupplierName}
                  onChange={(e) => setEditedSupplierName(e.target.value)}
                  className="edit-form-input"
                  required
                />
              </div>
              
              <div className="edit-form-group">
                <label className="edit-form-label">Email:</label>
                <input
                  type="email"
                  value={editedSupplierEmail}
                  onChange={(e) => setEditedSupplierEmail(e.target.value)}
                  className="edit-form-input"
                />
              </div>
              
              <div className="edit-form-group">
                <label className="edit-form-label">Phone:</label>
                <input
                  type="tel"
                  value={editedSupplierPhone}
                  onChange={(e) => setEditedSupplierPhone(e.target.value)}
                  className="edit-form-input"
                />
              </div>
              
              <div className="edit-form-group">
                <label className="edit-form-label">Address:</label>
                <textarea
                  value={editedSupplierAddress}
                  onChange={(e) => setEditedSupplierAddress(e.target.value)}
                  rows="3"
                  className="edit-form-textarea"
                />
              </div>
              
              <div className="edit-modal-buttons">
                <button 
                  type="button" 
                  onClick={handleCloseEditModal}
                  className="edit-modal-button secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="edit-modal-button primary"
                >
                  Update Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Suppliers;
