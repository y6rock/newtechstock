import React, { useState, useEffect } from 'react';
import ProductManager from '../../../components/ProductManager/ProductManager';
import { useSettings } from '../../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import './Products.css';

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
      <div className="products-loading-container">
        <div className="products-loading-content">
          <p>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  return (
    <div className="products-container">
      <ProductManager />
    </div>
  );
}


