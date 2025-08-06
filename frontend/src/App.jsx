import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Subadmin imports
import SubadminDashboard from './pages/subadmin/SubAdminDashboard';
import PlotManager from './components/subadmin/PlotManager';
import Approvals from './components/subadmin/Approvals';
import ComplianceManagement from './components/subadmin/ComplianceManagement';

// User imports
import Login from './pages/auth/Login';
import UserLayout from './layouts/UserLayout';
import HomePage from './pages/user/HomePage';
import PlotDetail from './pages/user/PlotDetail';
import SocietiesPage from './pages/user/SocietiesPage';

// Admin imports
import Sidebar from "./components/admin/sidebar";
import Layout from "./components/admin/layout";
import Dashboard from "./pages/admin/dashboard";
import UserManagementDashboard from "./pages/admin/userManagementDashboard";
import SocietyManagement from "./pages/admin/SocietyManagement";
import ReviewManagement from "./pages/admin/ReviewManagement";  
import ReportManagement from "./pages/admin/ReportManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<Login />} />

        {/* User Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="plot-detail" element={<PlotDetail />} />
          <Route path="society" element={<SocietiesPage />} />
        </Route>

        {/* Subadmin Routes */}
        <Route path="/subadmin" element={<SubadminDashboard />}>
          <Route index element={<PlotManager />} />
          <Route path="plotManagement" element={<PlotManager />} />
          <Route path="floorPlan" element={<div>Floor Plan Component</div>} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="compliance" element={<ComplianceManagement />} />
        </Route>

        {/* Admin Routes with Sidebar + Layout */}
        <Route
          path="*"
          element={
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/userManagementDashboard" element={<UserManagementDashboard />} />
                    <Route path="/society-management" element={<SocietyManagement />} />
                    <Route path="/review-management" element={<ReviewManagement />} />
                    <Route path="/reports" element={<ReportManagement />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
