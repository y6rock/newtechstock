import React from 'react';
import Sidebar from './Sidebar';

export default function Settings() {
  return (
    <div style={ display: 'flex' }>
      <Sidebar />
      <div style={ marginLeft: '200px', padding: '20px', width: '100%' }>
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
    </div>
  );
}