import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div style={{
      width: '200px',
      height: '100vh',
      backgroundColor: '#343a40',
      color: '#fff',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <h3 style={{ color: '#fff' }}>Admin Panel</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ margin: '10px 0' }}>
          <Link to="/manager/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
        </li>
        <li style={{ margin: '10px 0' }}>
          <Link to="/manager/products" style={{ color: '#fff', textDecoration: 'none' }}>Products</Link>
        </li>
        <li style={{ margin: '10px 0' }}>
          <Link to="/manager/customers" style={{ color: '#fff', textDecoration: 'none' }}>Customers</Link>
        </li>
        <li style={{ margin: '10px 0' }}>
          <Link to="/manager/settings" style={{ color: '#fff', textDecoration: 'none' }}>Settings</Link>
        </li>
      </ul>
    </div>
  );
}