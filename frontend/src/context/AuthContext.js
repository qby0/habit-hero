import React, { createContext, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/register', userData);
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        toast.success('Registration successful!');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      toast.error(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', userData);
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        toast.success('Login successful!');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      toast.error(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.get('/api/auth/me');
      
      if (res.data.success) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
      setIsAuthenticated(false);
      setUser(null);
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return false;
      }
      
      // Set auth token in headers
      axios.defaults.headers.common['x-auth-token'] = token;
      
      const res = await axios.put('/api/users/profile', userData);
      
      if (res.data.success) {
        setUser(res.data.user);
        toast.success('Profile updated successfully');
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      toast.error(err.response?.data?.message || 'Profile update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user data (for when habits are completed and XP/level changes)
  const updateUserData = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        checkAuth,
        updateProfile,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 