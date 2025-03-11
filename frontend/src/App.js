import React, { useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthContext, AuthProvider } from './context/AuthContext';
import { HabitProvider } from './context/HabitContext';
import { AchievementProvider } from './context/AchievementContext';
import { WorkshopProvider } from './context/WorkshopContext';
import { ThemeProvider as CustomThemeProvider } from './context/ThemeContext';
import theme from './theme';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Ленивая загрузка страниц
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const HabitDetail = lazy(() => import('./pages/HabitDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Workshop = lazy(() => import('./pages/Workshop'));
const WorkshopDetail = lazy(() => import('./pages/WorkshopDetail'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Groups = lazy(() => import('./pages/Groups'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const GroupSettings = lazy(() => import('./pages/GroupSettings'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Защищенный маршрут
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <CustomThemeProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <HabitProvider>
            <AchievementProvider>
              <WorkshopProvider>
                <Router>
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <Layout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<Dashboard />} />
                        <Route path="habits/:id" element={<HabitDetail />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="achievements" element={<Achievements />} />
                        <Route path="workshop" element={<Workshop />} />
                        <Route path="workshop/:id" element={<WorkshopDetail />} />
                        <Route path="challenges" element={<Challenges />} />
                        <Route path="groups" element={<Groups />} />
                        <Route path="groups/:id" element={<GroupDetail />} />
                        <Route path="groups/:id/settings" element={<GroupSettings />} />
                        <Route path="leaderboard" element={<Leaderboard />} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </Router>
                <ToastContainer position="bottom-right" />
              </WorkshopProvider>
            </AchievementProvider>
          </HabitProvider>
        </AuthProvider>
      </ThemeProvider>
    </CustomThemeProvider>
  );
}

export default App; 