import React, { useState, useEffect } from 'react';
import ProductManager from '../../components/ProductManager';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function Products() {
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
    <div style={{ flex: 1, padding: '20px' }}>
      <ProductManager />
    </div>
  );
}