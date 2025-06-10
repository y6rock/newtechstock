import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

const Suppliers = () => {
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [error, setError] = useState(null);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [editingSupplier, setEditingSupplier] = useState(null); // supplier object being edited
  const [editedSupplierName, setEditedSupplierName] = useState('');
  const [editedSupplierContact, setEditedSupplierContact] = useState('');

  useEffect(() => {
    if (loadingSettings) {
      return; // Wait for settings to load
    }
    if (!isUserAdmin) {
      navigate('/'); // Redirect if not admin
      return;
    }

    fetchSuppliers();
  }, [isUserAdmin, loadingSettings, navigate]);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(response.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers.');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierName.trim() || !newSupplierContact.trim()) {
      setError('Supplier name and contact cannot be empty.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/suppliers', { name: newSupplierName, contact: newSupplierContact }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewSupplierName('');
      setNewSupplierContact('');
      fetchSuppliers();
    } catch (err) {
      console.error('Error adding supplier:', err);
      setError(err.response?.data?.message || 'Failed to add supplier.');
    }
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setEditedSupplierName(supplier.name);
    setEditedSupplierContact(supplier.contact);
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    if (!editedSupplierName.trim() || !editedSupplierContact.trim()) {
      setError('Supplier name and contact cannot be empty.');
      return;
    }
    if (!editingSupplier) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/suppliers/${editingSupplier.supplier_id}`, { name: editedSupplierName, contact: editedSupplierContact }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingSupplier(null);
      setEditedSupplierName('');
      setEditedSupplierContact('');
      fetchSuppliers();
    } catch (err) {
      console.error('Error updating supplier:', err);
      setError(err.response?.data?.message || 'Failed to update supplier.');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        console.log('Attempting to delete supplier with ID:', supplierId);
        const token = localStorage.getItem('token');
        await axios.delete(`/api/suppliers/${supplierId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        setError(err.response?.data?.message || 'Failed to delete supplier.');
      }
    }
  };

  if (loadingSettings || loadingSuppliers) {
    return <div style={{ flex: 1, padding: '20px', textAlign: 'center' }}>Loading Admin Panel...</div>;
  }

  if (!isUserAdmin) {
    return null; // Should redirect, but return null just in case
  }

  return (
    <div style={{ flex: 1, padding: '20px' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '10px' }}>Manage Suppliers</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>Add, edit, or delete product suppliers.</p>

      {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}

      {/* Add New Supplier Form */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
        <h3 style={{ marginTop: '0', marginBottom: '15px' }}>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
        <form onSubmit={editingSupplier ? handleUpdateSupplier : handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="Supplier Name"
            value={editingSupplier ? editedSupplierName : newSupplierName}
            onChange={(e) => editingSupplier ? setEditedSupplierName(e.target.value) : setNewSupplierName(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            required
          />
          <input
            type="text"
            placeholder="Contact Info (e.g., email or phone)"
            value={editingSupplier ? editedSupplierContact : newSupplierContact}
            onChange={(e) => editingSupplier ? setEditedSupplierContact(e.target.value) : setNewSupplierContact(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            required
          />
          <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
          </button>
          {editingSupplier && (
            <button type="button" onClick={() => { setEditingSupplier(null); setNewSupplierName(''); setNewSupplierContact(''); setError(null); }} style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      {/* Suppliers List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>ID</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#555' }}>Contact</th>
              <th style={{ padding: '15px', textAlign: 'center', color: '#555' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No suppliers found.</td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.supplier_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>{supplier.supplier_id}</td>
                  <td style={{ padding: '15px' }}>{supplier.name}</td>
                  <td style={{ padding: '15px' }}>{supplier.contact}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button onClick={() => handleEditSupplier(supplier)} style={{ padding: '8px 12px', backgroundColor: '#ffc107', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handleDeleteSupplier(supplier.supplier_id)} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Delete</button>
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

export default Suppliers; 