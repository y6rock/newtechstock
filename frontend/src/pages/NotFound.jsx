import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-error-code">404</div>
        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-description">
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        <div className="not-found-buttons">
          <button onClick={() => navigate('/')} className="not-found-button not-found-button-primary">Go Home</button>
          <button onClick={() => navigate(-1)} className="not-found-button not-found-button-secondary">Go Back</button>
        </div>
        <div className="not-found-support">
          If you think this is an error, please contact support.
        </div>
      </div>
    </div>
  );
} 