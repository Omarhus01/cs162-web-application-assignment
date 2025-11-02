/**
 * Protected Route Component
 * =========================
 * Wrapper for routes that require authentication.
 * 
 * Shows loading spinner while checking auth status,
 * redirects to login if user is not authenticated,
 * otherwise renders the protected component.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Render protected component if authenticated, otherwise redirect to login
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
