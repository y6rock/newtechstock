import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

const Logo = () => {
  return (
    <Link to="/" className="logo-link">
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