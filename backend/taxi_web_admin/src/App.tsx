import React from 'react'; // v2 redeploy
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard, { Overview } from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Analytics from './pages/Analytics';
import Drivers from './pages/Drivers';
import DriverProfile from './pages/DriverProfile';
import DriverSubscriptions from './pages/DriverSubscriptions';
import Passengers from './pages/Passengers';
import PassengerProfile from './pages/PassengerProfile';
import TripDetails from './pages/TripDetails';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import Promotions from './pages/Promotions';
import Subscriptions from './pages/Subscriptions';
import Fares from './pages/Fares';
import Places from './pages/Places';

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
            <Route path="drivers/:id/subscriptions" element={<DriverSubscriptions />} />
            <Route path="passengers" element={<Passengers />} />
            <Route path="passengers/:id" element={<PassengerProfile />} />
            <Route path="trips/:id" element={<TripDetails />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="fares" element={<Fares />} />
            <Route path="places" element={<Places />} />
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
