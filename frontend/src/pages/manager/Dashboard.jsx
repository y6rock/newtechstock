import React, { useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
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
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Dashboard</h2>
        <p style={{ color: '#666', marginTop: '5px' }}>Overview of your store's performance</p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginTop: '30px'
        }}>
          <div style={{
            padding: '20px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3>Total Sales</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#343a40' }}>$12,345</p>
          </div>

          <div style={{
            padding: '20px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3>Total Orders</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#343a40' }}>156</p>
          </div>

          <div style={{
            padding: '20px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3>Total Customers</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#343a40' }}>89</p>
          </div>
        </div>
      </div>
    </div>
  );
}