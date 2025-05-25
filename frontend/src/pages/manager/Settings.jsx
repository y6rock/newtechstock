import React from 'react';

export default function Settings() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Settings</h2>
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
  );
}