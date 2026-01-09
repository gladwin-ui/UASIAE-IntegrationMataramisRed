import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Welcome } from './pages/Welcome';
import { Home } from './pages/Home';
import { RestaurantDetail } from './pages/RestaurantDetail';
import { OrderStatus } from './pages/OrderStatus';
import { Orders } from './pages/Orders';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { ManageUsers } from './pages/admin/ManageUsers';
import { ManageRestaurants } from './pages/admin/ManageRestaurants';
import { TrackDrivers } from './pages/admin/TrackDrivers';
import { DriverSalaries } from './pages/admin/DriverSalaries';
import { SalesStatistics } from './pages/admin/SalesStatistics';
import { TrackOrders } from './pages/admin/TrackOrders';
import { Payment } from './pages/Payment';
import { Invoice } from './pages/Invoice';
import { Register } from './pages/Register';
import { RoleRedirect } from './middleware/RoleRedirect';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const DriverRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isDriver } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isDriver) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const CustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isCustomer } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isCustomer) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Public routes are accessible to everyone, including authenticated users
  // RoleRedirect will handle redirecting authenticated users from root path
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Welcome />
          </PublicRoute>
        }
      />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Navbar />
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/browse"
        element={
          <>
            <Navbar />
            <Home />
          </>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Navbar />
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/restaurants"
        element={
          <AdminRoute>
            <Navbar />
            <ManageRestaurants />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <Navbar />
            <ManageUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <AdminRoute>
            <Navbar />
            <TrackDrivers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/salaries"
        element={
          <AdminRoute>
            <Navbar />
            <DriverSalaries />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/statistics"
        element={
          <AdminRoute>
            <Navbar />
            <SalesStatistics />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <Navbar />
            <TrackOrders />
          </AdminRoute>
        }
      />
      <Route
        path="/driver"
        element={
          <DriverRoute>
            <Navbar />
            <DriverDashboard />
          </DriverRoute>
        }
      />
      <Route
        path="/restaurants/:id"
        element={
          <CustomerRoute>
            <Navbar />
            <RestaurantDetail />
          </CustomerRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <CustomerRoute>
            <Navbar />
            <Orders />
          </CustomerRoute>
        }
      />
      <Route
        path="/payment/:id"
        element={
          <ProtectedRoute>
            <Navbar />
            <Payment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoice/:id"
        element={
          <ProtectedRoute>
            <Navbar />
            <Invoice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <Navbar />
            <OrderStatus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Navbar />
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <RoleRedirect>
          <AppRoutes />
        </RoleRedirect>
      </AuthProvider>
    </Router>
  );
};

export default App;

