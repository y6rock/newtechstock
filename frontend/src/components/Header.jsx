import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import Logo from './Logo';

export default function Header() {
  const { storeName, loadingSettings, isUserAdmin, username, setIsUserAdmin, setUsername } = useSettings();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsUserAdmin(false);
    setUsername(null);
  };

  return (
    <nav style={{ 
      padding: '10px 20px', 
      background: '#ffffff', 
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      {/* Left section with Logo and navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <Logo />
        <div style={{ display: 'flex', gap: '5px' }}>
          <Link to="/" style={{ 
            padding: '8px 12px',
            color: '#333',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}>Home</Link>
          <Link to="/about" style={{ 
            padding: '8px 12px',
            color: '#333',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}>About</Link>
          <Link to="/contact" style={{ 
            padding: '8px 12px',
            color: '#333',
            textDecoration: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}>Contact</Link>
          {username && (
            <Link to="/cart" style={{ 
              padding: '8px 12px',
              color: '#333',
              textDecoration: 'none',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}>Cart</Link>
          )}
        </div>
      </div>

      {/* Right section with auth links and store name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {!username ? (
            // Show login/signup when not logged in
            <>
              <Link to="/login" style={{ 
                padding: '8px 12px',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}>Login</Link>
              <Link to="/signup" style={{ 
                padding: '8px 12px',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}>Signup</Link>
            </>
          ) : (
            // Show username and logout when logged in
            <div style={{ 
              padding: '8px 12px',
              color: '#1976D2',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>Welcome, {username}</span>
              <button 
                onClick={handleLogout}
                style={{
                  padding: '4px 8px',
                  background: 'none',
                  border: '1px solid #1976D2',
                  color: '#1976D2',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s'
                }}
              >
                Logout
              </button>
            </div>
          )}
          {isUserAdmin && (
            <Link to="/manager/dashboard" style={{ 
              padding: '8px 12px',
              color: '#1976D2',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}>Manager</Link>
          )}
        </div>
      </div>
    </nav>
  );
}