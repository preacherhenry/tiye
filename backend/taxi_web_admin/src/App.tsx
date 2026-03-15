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
import ActiveTripsMap from './pages/ActiveTripsMap';
import TripHistory from './pages/TripHistory';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import Promotions from './pages/Promotions';
import Subscriptions from './pages/Subscriptions';
import Communications from './pages/Communications';
import Fares from './pages/Fares';
import Places from './pages/Places';
import FinancialSettings from './pages/FinancialSettings';
import WalletApprovals from './pages/WalletApprovals';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

import { hasPermission, type Permission } from './utils/rbac';

const PermissionRoute = ({ children, permission }: { children: React.ReactNode, permission: Permission }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!hasPermission(user.role, permission)) return <Navigate to="/" />;

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
            <Route path="messages" element={<Communications />} />
            <Route path="applications" element={<PermissionRoute permission="driver:manage"><Applications /></PermissionRoute>} />
            <Route path="rejected" element={<PermissionRoute permission="driver:manage"><Applications status="rejected" /></PermissionRoute>} />
            <Route path="applications/:id" element={<PermissionRoute permission="driver:manage"><ApplicationDetail /></PermissionRoute>} />
            <Route path="analytics" element={<PermissionRoute permission="finance:dashboard"><Analytics /></PermissionRoute>} />
            <Route path="drivers" element={<PermissionRoute permission="driver:manage"><Drivers /></PermissionRoute>} />
            <Route path="drivers/:id" element={<PermissionRoute permission="driver:manage"><DriverProfile /></PermissionRoute>} />
            <Route path="drivers/:id/subscriptions" element={<PermissionRoute permission="finance:dashboard"><DriverSubscriptions /></PermissionRoute>} />
            <Route path="passengers" element={<PermissionRoute permission="ride:monitor"><Passengers /></PermissionRoute>} />
            <Route path="passengers/:id" element={<PermissionRoute permission="ride:monitor"><PassengerProfile /></PermissionRoute>} />
            <Route path="trips/:id" element={<PermissionRoute permission="ride:monitor"><TripDetails /></PermissionRoute>} />
            <Route path="trip-history" element={<PermissionRoute permission="ride:monitor"><TripHistory /></PermissionRoute>} />
            <Route path="security-map" element={<PermissionRoute permission="ride:monitor"><ActiveTripsMap /></PermissionRoute>} />
            <Route path="promotions" element={<PermissionRoute permission="report:view_all"><Promotions /></PermissionRoute>} />
            <Route path="subscriptions" element={<PermissionRoute permission="finance:dashboard"><Subscriptions /></PermissionRoute>} />
            <Route path="fares" element={<PermissionRoute permission="report:view_all"><Fares /></PermissionRoute>} />
            <Route path="places" element={<PermissionRoute permission="report:view_all"><Places /></PermissionRoute>} />
            <Route path="financial-settings" element={<PermissionRoute permission="financial:manage"><FinancialSettings /></PermissionRoute>} />
            <Route path="wallet-approvals" element={<PermissionRoute permission="finance:approve"><WalletApprovals /></PermissionRoute>} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route
            path="/admin"
            element={
              <PermissionRoute permission="user:manage">
                <Dashboard />
              </PermissionRoute>
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
