import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ProductManager from '../../components/ProductManager';

export default function Products() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: '220px', flexShrink: 0 }}>
        <Sidebar />
      </div>
      <div style={{ marginLeft: '0', padding: '20px', width: '100%' }}>
        <h2>Manage Products</h2>
        <button
          style={{ padding: '8px 12px', marginBottom: '15px', backgroundColor: '#28a745', color: '#fff' }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Product'}
        </button>
        {showForm && <ProductManager />}
        {/* You can remove the static product list below if ProductManager handles listing */}
        {/* <ul>
          <li>Product A – Stock: 10 <button>Edit</button> <button>Delete</button></li>
          <li>Product B – Stock: 5 <button>Edit</button> <button>Delete</button></li>
        </ul> */}
      </div>
    </div>
  );
}