import React from 'react';
import Sidebar from './Sidebar';

export default function Customers() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar container with fixed width */}
      <div style={{ width: '200px', flexShrink: 0 }}>
        <Sidebar />
      </div>
      {/* Main content area - adjusted margin and width */}
      <div style={{ marginLeft: '200px', padding: '20px', width: 'calc(100% - 200px)' }}>
        <h2>Customer List</h2>
        <div style={{ marginTop: '20px' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
              <strong>Alice</strong> – alice@example.com
            </li>
            <li style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
              <strong>Bob</strong> – bob@example.com
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}