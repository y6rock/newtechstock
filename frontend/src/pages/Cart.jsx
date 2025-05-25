import React from 'react';

export default function Cart() {
  const cartItems = [
    { id: 1, name: 'Product A', price: 100, quantity: 2 },
    { id: 2, name: 'Product B', price: 150, quantity: 1 },
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Shopping Cart</h2>
      {cartItems.map(item => (
        <div key={item.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
          <p>{item.name} × {item.quantity} — ${item.price * item.quantity}</p>
        </div>
      ))}
      <h3>Total: ${cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)}</h3>
    </div>
  );
}