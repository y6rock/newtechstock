import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header/Header';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import Cart from './pages/Cart/Cart';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Sidebar from './components/Sidebar/Sidebar';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import Footer from './components/Footer/Footer';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Checkout from './pages/Checkout/Checkout';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound/NotFound';
import ProductDetails from './pages/ProductDetails/ProductDetails';
import OrderHistory from './pages/OrderHistory/OrderHistory';
import OrderConfirmation from './pages/OrderConfirmation/OrderConfirmation';
import PayPalTest from './pages/PayPalTest/PayPalTest';

import Dashboard from './pages/manager/Dashboard/Dashboard';
import Products from './pages/manager/Products/Products';
import Promotions from './pages/manager/Promotions/Promotions';
import Customers from './pages/manager/Customers/Customers';
import Settings from './pages/manager/Settings/Settings';
import Categories from './pages/manager/Categories/Categories';
import Suppliers from './pages/manager/Suppliers/Suppliers';
import Orders from './pages/manager/Orders/Orders';
import FloatingCart from './components/FloatingCart/FloatingCart';
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
      <ScrollToTop />
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
    <ToastProvider>
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
    </ToastProvider>
  );
}

export default App;
