import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [sortField, setSortField] = useState('supplier_id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
  const [supplierStats, setSupplierStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0
  });
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
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [editPhoneValidationError, setEditPhoneValidationError] = useState('');

  // Phone validation function (same as Signup)
  const validatePhone = (phone) => {
    if (!phone || !phone.trim()) return ''; // Phone is optional
    const phoneDigits = phone.replace(/\D/g, '');
    
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return 'Phone number must be between 7 and 15 digits. Examples: +1234567890, (123) 456-7890';
    }
    
    if (phoneDigits.length === phoneDigits.split('').filter(d => d === phoneDigits[0]).length) {
      return 'Phone number cannot be all the same digit';
    }
    
    const isSequential = phoneDigits.split('').every((digit, index) => {
      if (index === 0) return true;
      const currentDigit = parseInt(digit);
      const prevDigit = parseInt(phoneDigits[index - 1]);
      return currentDigit === (prevDigit + 1) % 10;
    });
    
    if (isSequential && phoneDigits.length >= 8) {
      return 'Phone number cannot be sequential numbers';
    }
    
    return '';
  };

  // Phone formatting function (same as Signup)
  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    } else {
      return `+${phoneNumber.slice(0, phoneNumber.length - 10)} (${phoneNumber.slice(-10, -7)}) ${phoneNumber.slice(-7, -4)}-${phoneNumber.slice(-4)}`;
    }
  };

  // Auto-refocus search input after re-renders to maintain typing experience
  useEffect(() => {
    if (searchInputRef.current && searchTerm) {
      searchInputRef.current.focus();
    }
  });

  // Sync sort state from URL for UI display
  useEffect(() => {
    const urlSortField = searchParams.get('sortField');
    const urlSortDirection = searchParams.get('sortDirection');
    if (urlSortField) {
      setSortField(urlSortField);
      setSortDirection(urlSortDirection === 'desc' ? 'desc' : 'asc');
    }
  }, [searchParams]);

  // Fetch supplier statistics - always global (no filters)
  const fetchSupplierStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      
      const response = await fetch(`/api/suppliers/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSupplierStats({
        totalSuppliers: data.totalSuppliers || 0,
        activeSuppliers: data.activeSuppliers || 0,
        inactiveSuppliers: data.inactiveSuppliers || 0
      });
    } catch (error) {
      console.error('Error fetching supplier statistics:', error);
    }
  }, []);

  // Fetch stats on initial load
  useEffect(() => {
    if (isUserAdmin && !loadingSettings) {
      fetchSupplierStats();
    }
  }, [isUserAdmin, loadingSettings, fetchSupplierStats]);

  // Ref-based search implementation - no re-renders during typing
  useEffect(() => {
    if (!isUserAdmin || loadingSettings) {
      if (!loadingSettings && !isUserAdmin) {
        navigate('/');
      }
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingSuppliers(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        // Read page from URL (single source of truth)
        const urlPage = parseInt(searchParams.get('page')) || 1;

        const params = new URLSearchParams({
          page: urlPage.toString(),
          limit: '10'
        });

        if (searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }
        
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }

        // Sorting from URL only (single source of truth)
        const urlSortField = searchParams.get('sortField');
        const urlSortDirection = searchParams.get('sortDirection');
        if (urlSortField && urlSortDirection) {
          params.append('sortField', urlSortField);
          params.append('sortDirection', urlSortDirection);
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
        const suppliersData = data.suppliers || data;
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        
        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          // Fallback: update pagination with URL page
          const urlPage = parseInt(searchParams.get('page')) || 1;
          setPagination(prev => ({
            ...prev,
            currentPage: urlPage
          }));
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setError('Failed to fetch suppliers');
      } finally {
        setLoadingSuppliers(false);
      }
    }, searchTerm.trim() ? 300 : 0); // Debounce only when searching

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, isUserAdmin, loadingSettings, navigate, searchParams]);

  // Handle page changes - inline fetch to avoid dependency issues
  const handlePageChange = useCallback(async (newPage) => {
    // Update URL parameters for pagination
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    if (statusFilter && statusFilter !== 'all') {
      params.set('status', statusFilter);
    } else {
      params.delete('status');
    }
    // Keep sort in URL (use existing URL values only)
    const existingUrlSortField = searchParams.get('sortField');
    const existingUrlSortDirection = searchParams.get('sortDirection');
    if (existingUrlSortField && existingUrlSortDirection) {
      params.set('sortField', existingUrlSortField);
      params.set('sortDirection', existingUrlSortDirection);
    }
    setSearchParams(params);

    try {
      setLoadingSuppliers(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const fetchParams = new URLSearchParams({
        page: newPage.toString(),
        limit: '10'
      });

      if (searchTerm.trim()) {
        fetchParams.append('search', searchTerm.trim());
      }
      
      if (statusFilter && statusFilter !== 'all') {
        fetchParams.append('status', statusFilter);
      }

      // Sorting from URL only (single source of truth)
      if (existingUrlSortField && existingUrlSortDirection) {
        fetchParams.append('sortField', existingUrlSortField);
        fetchParams.append('sortDirection', existingUrlSortDirection);
      }

      const response = await fetch(`/api/suppliers?${fetchParams}`, {
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
      } else {
        setPagination(prev => ({
          ...prev,
          currentPage: newPage
        }));
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Failed to fetch suppliers');
    } finally {
      setLoadingSuppliers(false);
    }
  }, [searchTerm, statusFilter, searchParams, setSearchParams]);

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

  // Sorting function - URL is the single source of truth
  const handleSort = (field) => {
    const urlSortField = searchParams.get('sortField');
    const urlSortDirection = searchParams.get('sortDirection') || 'asc';
    const currentField = urlSortField || sortField;
    
    const isSameField = currentField === field;
    const nextDirection = isSameField ? (urlSortDirection === 'asc' ? 'desc' : 'asc') : 'asc';

    // Update URL only (sortField/sortDirection will be synced from URL for UI display)
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (searchTerm) params.set('search', searchTerm); else params.delete('search');
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter); else params.delete('status');
    params.set('sortField', field);
    params.set('sortDirection', nextDirection);
    setSearchParams(params);
    // Rely on URL sync effect to trigger refetch
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
    if (phoneValidationError) {
      setError(phoneValidationError);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/suppliers', { 
        name: newSupplierName, 
        email: newSupplierEmail, 
        phone: newSupplierPhone, 
        address: newSupplierAddress 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const created = res?.data?.supplier || {
        // Prefer server-provided ID; fallback to insertId; avoid negative temp IDs
        supplier_id: (res?.data?.supplier_id ?? res?.data?.insertId) ?? undefined,
        name: newSupplierName,
        email: newSupplierEmail,
        phone: newSupplierPhone,
        address: newSupplierAddress,
        isActive: 1,
        status: 'Active'
      };
      // If we didn't get an ID back for some reason, refetch the current page to stay consistent
      if (created.supplier_id === undefined) {
        try {
          const params = new URLSearchParams({
            page: '1',
            limit: '10'
          });
          const token2 = localStorage.getItem('token');
          const resp = await fetch(`/api/suppliers?${params}`, {
            headers: { 'Authorization': `Bearer ${token2}` }
          });
          const data = await resp.json();
          setSuppliers(data.suppliers || data);
          if (data.pagination) setPagination(data.pagination);
        } catch (_) {
          // As a last resort, still add the created supplier without ID to show immediate feedback
          setSuppliers(prev => [created, ...prev]);
        }
      } else {
        setSuppliers(prev => [created, ...prev]);
      }
      setPagination(prev => ({ ...prev, totalItems: (prev.totalItems || 0) + 1 }));
      setNewSupplierName('');
      setNewSupplierEmail('');
      setNewSupplierPhone('');
      setNewSupplierAddress('');
      setShowAddModal(false);
      setError(null);
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
    if (editPhoneValidationError) {
      setError(editPhoneValidationError);
      return;
    }
    if (!editingSupplier) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/suppliers/${editingSupplier.supplier_id}`, { 
        name: editedSupplierName, 
        email: editedSupplierEmail, 
        phone: editedSupplierPhone, 
        address: editedSupplierAddress 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = res?.data?.supplier || {
        ...editingSupplier,
        name: editedSupplierName,
        email: editedSupplierEmail,
        phone: editedSupplierPhone,
        address: editedSupplierAddress
      };
      setSuppliers(prev => prev.map(s => (s.supplier_id === updated.supplier_id ? { ...s, ...updated } : s)));
      setEditingSupplier(null);
      setEditedSupplierName('');
      setEditedSupplierEmail('');
      setEditedSupplierPhone('');
      setEditedSupplierAddress('');
      setShowEditModal(false);
      setError(null);
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
    setEditPhoneValidationError('');
  };

  const handleCloseAddModal = () => {
    setNewSupplierName('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setNewSupplierAddress('');
    setShowAddModal(false);
    setError(null);
    setPhoneValidationError('');
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
          // Flip status locally
          setSuppliers(prev => prev.map(s => s.supplier_id === supplierId ? { ...s, isActive: 0, status: 'Inactive' } : s));
          // Refresh statistics to update filter button counts
          await fetchSupplierStats();
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
          // Flip status locally
          setSuppliers(prev => prev.map(s => s.supplier_id === supplierId ? { ...s, isActive: 1, status: 'Active' } : s));
          // Refresh statistics to update filter button counts
          await fetchSupplierStats();
          showSuccess('Supplier restored successfully!');
        } catch (err) {
          console.error('Error restoring supplier:', err);
          showError(err.response?.data?.message || 'Failed to restore supplier.');
        }
      }
    );
  };

  if (!isUserAdmin) {
    return null; // Should redirect, but return null just in case
  }
  const isLoading = loadingSettings || loadingSuppliers;

  // Render server-sorted suppliers directly

  return (
    <div className="suppliers-container">
      <h1 className="suppliers-title">Manage Suppliers</h1>
      <p className="suppliers-subtitle">Add, edit, or delete product suppliers.</p>
      {isLoading && (
        <div className="suppliers-loading" style={{ marginBottom: '10px' }}>Loading...</div>
      )}
      
      {error && <p className="suppliers-error">{error}</p>}

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-controls">
          <div className="search-filter-group">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search suppliers by name or email..."
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
                {pagination.totalItems} supplier{pagination.totalItems !== 1 ? 's' : ''} found
              </div>
            )}
            
            {/* Status Filter - Under Search Field */}
            <div className="status-filters" style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button 
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('all')}
                style={{
                  padding: '8px 16px',
                  border: `2px solid ${statusFilter === 'all' ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  backgroundColor: statusFilter === 'all' ? '#3b82f6' : 'white',
                  color: statusFilter === 'all' ? 'white' : '#64748b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                All ({supplierStats.totalSuppliers})
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('active')}
                style={{
                  padding: '8px 16px',
                  border: `2px solid ${statusFilter === 'active' ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  backgroundColor: statusFilter === 'active' ? '#3b82f6' : 'white',
                  color: statusFilter === 'active' ? 'white' : '#64748b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Active ({supplierStats.activeSuppliers})
              </button>
              <button 
                className={`filter-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('inactive')}
                style={{
                  padding: '8px 16px',
                  border: `2px solid ${statusFilter === 'inactive' ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  backgroundColor: statusFilter === 'inactive' ? '#3b82f6' : 'white',
                  color: statusFilter === 'inactive' ? 'white' : '#64748b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Inactive ({supplierStats.inactiveSuppliers})
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Add Supplier Button - moved under search to match Categories */}
      <div className="add-button-container">
        <button 
          onClick={() => setShowAddModal(true)}
          className="add-supplier-btn"
        >
          + Add New Supplier
        </button>
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
                  placeholder="(123) 456-7890"
                  value={newSupplierPhone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setNewSupplierPhone(formatted);
                    const error = validatePhone(formatted);
                    setPhoneValidationError(error);
                  }}
                  className={`form-input ${phoneValidationError ? 'error' : ''}`}
                />
                {phoneValidationError && <span className="field-error">{phoneValidationError}</span>}
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
                  placeholder="(123) 456-7890"
                  value={editedSupplierPhone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setEditedSupplierPhone(formatted);
                    const error = validatePhone(formatted);
                    setEditPhoneValidationError(error);
                  }}
                  className={`edit-form-input ${editPhoneValidationError ? 'error' : ''}`}
                />
                {editPhoneValidationError && <span className="field-error">{editPhoneValidationError}</span>}
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
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Suppliers;
