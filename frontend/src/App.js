import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
      <Header />
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Manager Routes (include their own Sidebar internally) */}
        <Route path="/manager/dashboard" element={<Dashboard />} />
        <Route path="/manager/products" element={<Products />} />
        <Route path="/manager/customers" element={<Customers />} />
        <Route path="/manager/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
