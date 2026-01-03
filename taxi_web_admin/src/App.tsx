import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard, { Overview } from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Analytics from './pages/Analytics';
import Drivers from './pages/Drivers';
import DriverProfile from './pages/DriverProfile';
import Passengers from './pages/Passengers';
import PassengerProfile from './pages/PassengerProfile';
import TripDetails from './pages/TripDetails';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'super_admin') return <Navigate to="/" />;

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="applications" element={<Applications />} />
            <Route path="rejected" element={<Applications status="rejected" />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="drivers/:id" element={<DriverProfile />} />
            <Route path="passengers" element={<Passengers />} />
            <Route path="passengers/:id" element={<PassengerProfile />} />
            <Route path="trips/:id" element={<TripDetails />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route
            path="/admin"
            element={
              <SuperAdminRoute>
                <Dashboard />
              </SuperAdminRoute>
            }
          >
            <Route index element={<AdminPanel />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
