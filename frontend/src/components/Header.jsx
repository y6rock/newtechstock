import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
import './Header.css'; // Import the new CSS file

export default function Header() {
  const { isUserAdmin, username, reEvaluateToken } = useSettings();
  const { totalItems } = useCart();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    reEvaluateToken(); // This will reload the page and clear the state
    // No need to navigate manually, the reload handles it.
  };

  const closeMenu = () => {
    setMenuOpen(false);
  }

  return (
    <nav className="header-nav">
      <div className="header-left">
        <Logo />
      </div>

      <div className={`header-nav-container ${menuOpen ? 'active' : ''}`}>
        <div className="header-nav-links">
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/products" onClick={closeMenu}>Products</Link>
          {username && (
            <Link to="/cart" ref={cartTabRef} className="cart-link" onClick={closeMenu}>
              Cart {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </Link>
          )}
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          <Link to="/about" onClick={closeMenu}>About</Link>
        </div>

        <div className="header-right">
          <div className="header-auth-links">
            {!username ? (
              <>
                <Link to="/login" onClick={closeMenu}>Login</Link>
                <Link to="/signup" onClick={closeMenu}>Signup</Link>
              </>
            ) : (
              <div className="header-auth-welcome">
                <Link to="/profile" onClick={closeMenu}>Welcome, {username}</Link>
                <button onClick={handleLogout} className="header-auth-logout-btn">Logout</button>
              </div>
            )}
          </div>
          {isUserAdmin && (
            <Link to="/manager/dashboard" className="manager-link" onClick={closeMenu}>Manager</Link>
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