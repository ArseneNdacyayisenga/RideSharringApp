import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyTwoFactor from './pages/auth/VerifyTwoFactor';

// Rider Pages
import RiderDashboard from './pages/rider/Dashboard';
import BookRide from './pages/rider/BookRide';
import RideHistory from './pages/rider/RideHistory';
import RiderPayment from './pages/rider/Payment';
import RiderProfile from './pages/rider/Profile';

// Driver Pages
import DriverDashboard from './pages/driver/Dashboard';
import DriverRides from './pages/driver/DriverRides';
import DriverHistory from './pages/driver/DriverHistory';
import DriverProfile from './pages/driver/Profile';
import DriverEarnings from './pages/driver/Earnings';

// Shared Pages
import NotFound from './pages/NotFound';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-dark-950">
        <div className="loader"></div>
        <p className="ml-3 text-primary-400">Loading RwandaRide...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-2fa" element={<VerifyTwoFactor />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        {/* Rider Routes */}
        <Route
          path="/rider/dashboard"
          element={
            <ProtectedRoute user={user} allowedRole="RIDER">
              <RiderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider/book"
          element={
            <ProtectedRoute user={user} allowedRole="RIDER">
              <BookRide />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider/history"
          element={
            <ProtectedRoute user={user} allowedRole="RIDER">
              <RideHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider/payment"
          element={
            <ProtectedRoute user={user} allowedRole="RIDER">
              <RiderPayment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rider/profile"
          element={
            <ProtectedRoute user={user} allowedRole="RIDER">
              <RiderProfile />
            </ProtectedRoute>
          }
        />

        {/* Driver Routes */}
        <Route
          path="/driver/dashboard"
          element={
            <ProtectedRoute user={user} allowedRole="DRIVER">
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/rides"
          element={
            <ProtectedRoute user={user} allowedRole="DRIVER">
              <DriverRides />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/history"
          element={
            <ProtectedRoute user={user} allowedRole="DRIVER">
              <DriverHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/earnings"
          element={
            <ProtectedRoute user={user} allowedRole="DRIVER">
              <DriverEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/profile"
          element={
            <ProtectedRoute user={user} allowedRole="DRIVER">
              <DriverProfile />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirect to appropriate dashboard if already logged in */}
      <Route
        path="/"
        element={
          user ? (
            user.role === 'RIDER' ? (
              <Navigate to="/rider/dashboard" replace />
            ) : (
              <Navigate to="/driver/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Protected Route Component
function ProtectedRoute({ user, allowedRole, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return user.role === 'RIDER' ? (
      <Navigate to="/rider/dashboard" replace />
    ) : (
      <Navigate to="/driver/dashboard" replace />
    );
  }

  return children;
}

export default App;