import React, { useState } from 'react';
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
import ResetPassword from './pages/ResetPassword';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ProductDetails from './pages/ProductDetails';
import OrderHistory from './pages/OrderHistory';
import OrderConfirmation from './pages/OrderConfirmation';
import PayPalTest from './pages/PayPalTest';

import Dashboard from './pages/manager/Dashboard';
import Products from './pages/manager/Products';
import Promotions from './pages/manager/Promotions';
import Customers from './pages/manager/Customers';
import Settings from './pages/manager/Settings';
import Categories from './pages/manager/Categories';
import Suppliers from './pages/manager/Suppliers';
import Orders from './pages/manager/Orders';
import FloatingCart from './components/FloatingCart';
import useWindowSize from './hooks/useWindowSize';

import axios from 'axios';

// Global axios interceptor for token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.message === 'Invalid token') {
      // Token is expired, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App({ isManagerRoute }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  const MainContent = () => (
    <div className={`main-content ${isManagerRoute ? 'admin-view' : ''}`}>
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
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/paypal-test" element={<PayPalTest />} />

        {/* Manager Routes */}
        <Route path="/manager/dashboard" element={<Dashboard />} />
        <Route path="/manager/products" element={<Products />} />
        <Route path="/manager/promotions" element={<Promotions />} />
        <Route path="/manager/customers" element={<Customers />} />
        <Route path="/manager/categories" element={<Categories />} />
        <Route path="/manager/suppliers" element={<Suppliers />} />
        <Route path="/manager/orders" element={<Orders />} />
        <Route path="/manager/settings" element={<Settings />} />

        {/* 404 Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );

  return (
    <>
      <Header />

      {isManagerRoute ? (
        <>
          {isMobile && (
            <button className="admin-hamburger-button" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
          )}
          <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', position: 'relative' }}>
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <MainContent />
          </div>
        </>
      ) : (
        <div style={{ minHeight: 'calc(100vh - 120px)' }}>
          <MainContent />
        </div>
      )}

      <FloatingCart />
      <Footer />
    </>
  );
}

export default App;
