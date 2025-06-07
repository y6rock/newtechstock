import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function Customers() {
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingSettings && !isUserAdmin) {
      navigate('/');
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  if (loadingSettings) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ flex: 1, padding: '20px', textAlign: 'center' }}>
          <p>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar is fixed, its width creates space */}
      <Sidebar />
      {/* Main content area - use flex: 1 and padding for responsiveness */}
      <div style={{ flex: 1, padding: '20px', paddingLeft: '240px' }}>
        <h2>Customers</h2>
        <p style={{ color: '#666', marginTop: '5px' }}>Manage your store's customers</p>
        {/* Customer Management Content Here */}
        <div style={{ marginTop: '20px', border: '1px dashed #ccc', padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>Customer listing and management will go here.</p>
          <p>E.g., View Customer Details, Edit, Delete, etc.</p>
        </div>
      </div>
    </div>
  );
}