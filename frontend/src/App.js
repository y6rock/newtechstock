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
import ProductsPage from './pages/ProductsPage';
import Footer from './components/Footer';
import ForgotPassword from './pages/ForgotPassword';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ProductDetails from './pages/ProductDetails';

import Dashboard from './pages/manager/Dashboard';
import Products from './pages/manager/Products';
import Customers from './pages/manager/Customers';
import Settings from './pages/manager/Settings';
import Categories from './pages/manager/Categories';
import Suppliers from './pages/manager/Suppliers';

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
          padding: '30px', // Consistent padding for all content within this main content area
          boxSizing: 'border-box',
          width: isManagerRoute ? 'calc(100% - 220px)' : '100%', // Ensure width respects sidebar
        }}>
          <Routes>
            {/* User Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />

            {/* Manager Routes */}
            <Route path="/manager/dashboard" element={<Dashboard />} />
            <Route path="/manager/products" element={<Products />} />
            <Route path="/manager/customers" element={<Customers />} />
            <Route path="/manager/categories" element={<Categories />} />
            <Route path="/manager/suppliers" element={<Suppliers />} />
            <Route path="/manager/settings" element={<Settings />} />

            {/* 404 Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>

      {/* Footer always renders at the bottom, full width */}
      <Footer />
    </>
  );
}

export default App;
