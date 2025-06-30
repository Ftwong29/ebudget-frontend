import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PrivateRoute from './PrivateRoute';
import BudgetInputPage from '../pages/BudgetInputPage';
import BudgetUploadPage from '../pages/BudgetUploadPage';
import PPEInputPage from '../pages/PPEInputPage'; // ✅ 新增导入
import LoginPage from '../pages/Login';
import DashboardPage from '../pages/Dashboard';
import ReportPNL from '../pages/ReportPNL';
import ReportPNLSummary from '../pages/ReportPNLSummary';

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
          path="/budget-upload"
          element={
            <PrivateRoute>
              <BudgetUploadPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/ppe-input"
          element={
            <PrivateRoute>
              <PPEInputPage />
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
        <Route
          path="/report/pnl-summary"
          element={
            <PrivateRoute>
              <ReportPNLSummary />
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
