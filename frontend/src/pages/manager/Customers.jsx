import React from 'react';

export default function Customers() {
  const customers = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Customer List</h2>
      <ul>
        {customers.map(customer => (
          <li key={customer.id}>
            {customer.name} – {customer.email}
          </li>
        ))}
      </ul>
    </div>
  );
}