import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '../layouts/MainLayout';
import PrivateRoute from './PrivateRoute';
import BudgetInputPage from '../pages/BudgetInputPage';
import BudgetUploadPage from '../pages/BudgetUploadPage';
import PPEInputPage from '../pages/PPEInputPage';
import LoginPage from '../pages/Login';
import DashboardPage from '../pages/Dashboard';
import SuperDashboardPage from '../pages/SuperDashboard';
import ReportPNL from '../pages/ReportPNL';
import ReportPNLSummary from '../pages/ReportPNLSummary';
import ReportPPE from '../pages/ReportPPE';

const DashboardWrapper = () => {
  const { user } = useSelector((state) => state.auth);
  return user?.is_superuser ? <SuperDashboardPage /> : <DashboardPage />;
};

const Router = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<DashboardWrapper />} />
        <Route path="budget-input" element={<BudgetInputPage />} />
        <Route path="budget-upload" element={<BudgetUploadPage />} />
        <Route path="ppe-input" element={<PPEInputPage />} />
        <Route path="report/pnl" element={<ReportPNL />} />
        <Route path="report/pnl-summary" element={<ReportPNLSummary />} />
        <Route path="report/ppe" element={<ReportPPE />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default Router;
