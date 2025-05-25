import React from 'react';
import Sidebar from './Sidebar';

export default function Customers() {
  return (
    <div style={ display: 'flex' }>
      <Sidebar />
      <div style={ marginLeft: '200px', padding: '20px', width: '100%' }>
        <h2>Customer List</h2>
<ul>
  <li>Alice – alice@example.com</li>
  <li>Bob – bob@example.com</li>
</ul>
      </div>
    </div>
  );
}