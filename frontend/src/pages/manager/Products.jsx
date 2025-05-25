import React from 'react';
import Sidebar from './Sidebar';

export default function Products() {
  return (
    <div style={ display: 'flex' }>
      <Sidebar />
      <div style={ marginLeft: '200px', padding: '20px', width: '100%' }>
        <h2>Manage Products</h2>
<button style={{ padding: '8px 12px', marginBottom: '15px', backgroundColor: '#28a745', color: '#fff' }}>
  Add New Product
</button>
<ul>
  <li>Product A – Stock: 10 <button>Edit</button> <button>Delete</button></li>
  <li>Product B – Stock: 5 <button>Edit</button> <button>Delete</button></li>
</ul>
      </div>
    </div>
  );
}