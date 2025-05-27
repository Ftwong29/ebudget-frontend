import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PrivateRoute from './PrivateRoute';
import BudgetInputPage from '../pages/BudgetInputPage';
import LoginPage from '../pages/Login';
import DashboardPage from '../pages/Dashboard';
import ReportPNL from '../pages/ReportPNL'; // ✅ 新增导入

const Router = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/budget-input"
          element={
            <PrivateRoute>
              <BudgetInputPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/report/pnl"
          element={
            <PrivateRoute>
              <ReportPNL />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Catch all unmatched routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default Router;
