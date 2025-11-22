import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Receipts from './pages/Receipts';
import Deliveries from './pages/Deliveries';
import Transfers from './pages/Transfers';
import Adjustments from './pages/Adjustments';
import MoveHistory from './pages/MoveHistory';
import Warehouses from './pages/Warehouses';
import Locations from './pages/Locations';
import Stock from './pages/Stock';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="adjustments" element={<Adjustments />} />
          <Route path="move-history" element={<MoveHistory />} />
          <Route path="warehouses" element={<Warehouses />} />
          <Route path="locations" element={<Locations />} />
          <Route path="stock" element={<Stock />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
