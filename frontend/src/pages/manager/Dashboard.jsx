import React from 'react';
import Sidebar from './Sidebar';

export default function Dashboard() {
  return (
    <div style={ display: 'flex' }>
      <Sidebar />
      <div style={ marginLeft: '200px', padding: '20px', width: '100%' }>
        <h2>Manager Dashboard</h2><p>Welcome, Admin! Here you can view statistics and manage your store.</p>
      </div>
    </div>
  );
}