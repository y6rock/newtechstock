import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Tech icon */}
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #2196F3, #1976D2)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            width: '16px',
            height: '16px',
            border: '2px solid white',
            borderRadius: '4px',
            transform: 'rotate(45deg)'
          }} />
          <div style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: 'white',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
        </div>
        
        {/* Text */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.2'
        }}>
          <span style={{
            color: '#1976D2',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            letterSpacing: '0.5px'
          }}>
            TechStock
          </span>
          <span style={{
            color: '#666',
            fontSize: '0.7rem',
            letterSpacing: '1px'
          }}>
            INNOVATION & QUALITY
          </span>
        </div>
      </div>
    </Link>
  );
};

export default Logo; 