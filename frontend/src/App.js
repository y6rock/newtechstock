import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';

import Dashboard from './pages/manager/Dashboard';
import Products from './pages/manager/Products';
import Customers from './pages/manager/Customers';
import Settings from './pages/manager/Settings';

function App({ isManagerRoute }) {
  console.log('App.js - isManagerRoute:', isManagerRoute);

  return (
    <>
      {/* Header always renders at the top, full width */}
      <Header />

      {/* This div applies margin to the content area below the header */}
      <div style={{
        marginLeft: isManagerRoute ? '240px' : '0',
        transition: 'margin-left 0.3s ease'
      }}>
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Manager Routes */}
          <Route path="/manager/dashboard" element={<Dashboard />} />
          <Route path="/manager/products" element={<Products />} />
          <Route path="/manager/customers" element={<Customers />} />
          <Route path="/manager/settings" element={<Settings />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
