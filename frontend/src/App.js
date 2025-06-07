import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Sidebar from './components/Sidebar';

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

      {/* Main container for the Sidebar and content below the header */}
      <div style={{
        display: 'flex',
        minHeight: 'calc(100vh - 60px)', // Adjust minHeight based on Header height
        position: 'relative', // Needed for fixed sidebar positioning relative to this container
      }}>
        {/* Conditionally render Sidebar - it has position: fixed inside it */}
        {isManagerRoute && <Sidebar />}

        {/* This div contains all the routes and takes the remaining space, pushed by sidebar */}
        <div style={{
          flex: 1, // Take remaining space
          marginLeft: isManagerRoute ? '220px' : '0', // Apply margin to push content away from fixed sidebar
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 60px)',
          padding: '30px', // Increased padding for more space
          boxSizing: 'border-box',
          width: isManagerRoute ? 'calc(100% - 220px)' : '100%', // Ensure width respects sidebar
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
      </div>
    </>
  );
}

export default App;
