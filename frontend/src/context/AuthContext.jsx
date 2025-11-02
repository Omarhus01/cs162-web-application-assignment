/**
 * Authentication Context
 * ======================
 * Provides authentication state and methods throughout the app.
 * Handles login, logout, and user data persistence.
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking auth with session...');
      
      try {
        console.log('📡 Fetching user data...');
        const response = await authAPI.getUser();
        console.log('✅ User data received:', response.data);
        setUser(response.data);
      } catch (error) {
        console.log('❌ Not authenticated');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await authAPI.login(credentials);
      console.log('✅ Login response:', response.data);
      
      const { user } = response.data;
      
      setUser(user);
      
      console.log('✅ Login successful! User:', user);
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error response:', error.response);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting registration with:', userData);
      const response = await authAPI.register(userData);
      console.log('Registration response:', response);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    setUser(null);
    // Call logout endpoint to clear session on server
    authAPI.logout().catch(() => {});
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
