import React from 'react';
import Sidebar from './Sidebar';

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar container with fixed width */}
      <div style={{ width: '200px', flexShrink: 0 }}>
        <Sidebar />
      </div>
      {/* Main content area - adjusted margin and width */}
      <div style={{ marginLeft: '200px', padding: '20px', width: 'calc(100% - 200px)' }}>
        <h2>Dashboard</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <h3>Total Sales</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>$12,345</p>
          </div>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <h3>Total Orders</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>156</p>
          </div>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <h3>Total Customers</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>89</p>
          </div>
        </div>
      </div>
    </div>
  );
}