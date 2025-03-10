import React, { useContext, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthContext } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HabitDetail from './pages/HabitDetail';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import NotFound from './pages/NotFound';

// Components
import Layout from './components/Layout';
import Loading from './components/Loading';

const App = () => {
  const { isAuthenticated, loading, checkAuth } = useContext(AuthContext);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) return <Loading />;
    
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  if (loading) return <Loading />;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="habits/:id" element={<HabitDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="achievements" element={<Achievements />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App; 