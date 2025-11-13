import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

/**
 * ProtectedRoute component that restricts access to admin-only routes
 * Redirects non-admin users to home page
 */
const ProtectedRoute = ({ children }) => {
  const { isUserAdmin, loadingSettings } = useSettings();

  // Show loading state while checking authentication
  if (loadingSettings) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  // Redirect non-admin users to home
  if (!isUserAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render the protected content for admin users
  return <>{children}</>;
};

export default ProtectedRoute;

