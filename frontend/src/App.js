import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      {/* MainLayout is a direct child of Router */}
      <MainLayout />
    </Router>
  );
}

// Component that uses useLocation and renders the main content structure
function MainLayout() {
  const location = useLocation();
  const isManagerRoute = location.pathname.startsWith('/manager');

  // Calculate the total width of the fixed sidebar including padding
  // Sidebar width: 200px, padding: 20px on each side
  const sidebarFullWidth = 200 + (20 * 2);

  return (
    // Apply left margin to the main content area when on a manager route
    <div style={{ marginLeft: isManagerRoute ? `${sidebarFullWidth}px` : '0' }}>
      <Header />
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Manager Routes (Manager pages will render their own Sidebar internally) */}
        <Route path="/manager/dashboard" element={<Dashboard />} />
        <Route path="/manager/products" element={<Products />} />
        <Route path="/manager/customers" element={<Customers />} />
        <Route path="/manager/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

export default App;
