import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <nav style={{ padding: '10px', background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ margin: '0 10px' }}>Home</Link>
      <Link to="/about" style={{ margin: '0 10px' }}>About</Link>
      <Link to="/contact" style={{ margin: '0 10px' }}>Contact</Link>
      <Link to="/cart" style={{ margin: '0 10px' }}>Cart</Link>
      <Link to="/login" style={{ margin: '0 10px' }}>Login</Link>
      <Link to="/signup" style={{ margin: '0 10px' }}>Signup</Link>
      <Link to="/manager/dashboard" style={{ margin: '0 10px', fontWeight: 'bold' }}>Manager</Link>
    </nav>
  );
}