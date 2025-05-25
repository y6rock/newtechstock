import React from 'react';

export default function Products() {
  const products = [
    { id: 1, name: 'Product A', stock: 10 },
    { id: 2, name: 'Product B', stock: 5 }
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Manage Products</h2>
      <button style={{ padding: '8px 12px', marginBottom: '15px', backgroundColor: '#28a745', color: '#fff' }}>
        Add New Product
      </button>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            {product.name} – Stock: {product.stock}
            <button style={{ marginLeft: '10px', padding: '5px 10px' }}>Edit</button>
            <button style={{ marginLeft: '5px', padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff' }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}