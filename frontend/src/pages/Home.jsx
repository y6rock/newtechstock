import React from 'react';

export default function Home() {
  const products = [
    { id: 1, name: 'Product A', price: 100, image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'Product B', price: 150, image: 'https://via.placeholder.com/150' },
    { id: 3, name: 'Product C', price: 120, image: 'https://via.placeholder.com/150' },
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>Welcome to TechStock</h1>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
        {products.map((product) => (
          <div key={product.id} style={{
            border: '1px solid #ccc',
            borderRadius: '10px',
            margin: '10px',
            padding: '10px',
            width: '200px',
            textAlign: 'center',
            boxShadow: '0 0 10px #ddd'
          }}>
            <img src={product.image} alt={product.name} style={{ width: '100%', borderRadius: '5px' }} />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            <button style={{
              padding: '8px 12px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}