import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { FaUser } from 'react-icons/fa';
import Logo from '../Logo/Logo';
import HeaderSearch from '../HeaderSearch/HeaderSearch';
import './Header.css';

export default function Header() {
  const { isUserAdmin, username, reEvaluateToken } = useSettings();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const cartTabRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.cartTabRef = cartTabRef;
    return () => {
      if (window.cartTabRef === cartTabRef) {
        window.cartTabRef = null;
      }
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    // Don't clear cart on logout - it's saved per user in session
    // The cart will be automatically loaded when the user logs back in
    localStorage.removeItem('token');
    navigate('/'); // Redirect to Home page first
    reEvaluateToken(); // This will clear the state and refresh user data
  };

  return (
    <nav className="header-nav">
      <div className="header-left">
        <Logo />
      </div>

      <div className={`header-nav-container ${menuOpen ? 'active' : ''}`}>
        {!isUserAdmin && (
          <div className="header-nav-links">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            {username && (
              <Link to="/cart" ref={cartTabRef} className="cart-link">
                Cart {totalItems > 0 && (
                  <span className="cart-badge">{totalItems}</span>
                )}
              </Link>
            )}
            <Link to="/contact">Contact</Link>
            <Link to="/about">About</Link>
          </div>
        )}

        <div className="header-right">
          {/* Search Bar - Next to Auth Links (only for non-admin) */}
          {!isUserAdmin && (
            <div className="header-search-container">
              <HeaderSearch />
            </div>
          )}
          
          <div className="header-auth-links">
            {!username ? (
              <>
                <Link to="/login">Login</Link>
                <Link to="/signup">Signup</Link>
              </>
            ) : (
              <div className="header-auth-welcome">
                <Link to="/profile">
                  <FaUser className="header-user-icon" />
                  Welcome, {username}
                </Link>
                <button onClick={handleLogout} className="header-auth-logout-btn">Logout</button>
              </div>
            )}
          </div>
          {isUserAdmin && (
            <Link to="/manager/dashboard" className="manager-link">Manager</Link>
          )}
        </div>
      </div>

      <button className="hamburger-menu" onClick={() => setMenuOpen(!menuOpen)}>
        <div></div>
        <div></div>
        <div></div>
      </button>
    </nav>
  );
}