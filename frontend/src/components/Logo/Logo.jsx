import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import './Logo.css';

const Logo = () => {
  const { isUserAdmin } = useSettings();
  // Route to dashboard if admin, home if not
  const logoPath = isUserAdmin ? '/manager/dashboard' : '/';
  
  return (
    <Link to={logoPath} className="logo-link">
      <div className="logo-container">
        {/* Tech icon */}
        <div className="logo-icon">
          <div className="logo-icon-square" />
          <div className="logo-icon-circle" />
        </div>
        
        {/* Text */}
        <div className="logo-text-container">
          <span className="logo-main-text">
            TechStock
          </span>
          <span className="logo-sub-text">
            INNOVATION & QUALITY
          </span>
        </div>
      </div>
    </Link>
  );
};

export default Logo; 