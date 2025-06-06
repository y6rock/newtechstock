import React from 'react';
import Sidebar from './Sidebar';

export default function Settings() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar container with fixed width */}
      <div style={{ width: '200px', flexShrink: 0 }}>
        <Sidebar />
      </div>
      {/* Main content area - adjusted margin and width */}
      <div style={{ marginLeft: '200px', padding: '20px', width: 'calc(100% - 200px)' }}>
        <h2>Settings</h2>
        <div style={{ marginTop: '20px' }}>
          <label>
            Store Name:
            <input type="text" placeholder="TechStock" style={{ marginLeft: '10px', padding: '5px' }} />
          </label>
          <br /><br />
          <label>
            Email Notifications:
            <input type="checkbox" defaultChecked style={{ marginLeft: '10px' }} />
          </label>
        </div>
      </div>
    </div>
  );
}