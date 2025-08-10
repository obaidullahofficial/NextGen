import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Subadmin imports
import SubadminDashboard from './pages/subadmin/SubAdminDashboard';
import SocietyProfile from './pages/subadmin/SocietyProfile';
import PlotManager from './pages/subadmin/PlotManager';
import Approvals from './pages/subadmin/Approvals';
import ComplianceManagement from './pages/subadmin/ComplianceManagement';
import FloorPlanGenerator from './pages/subadmin/FloorPlanGenerator';

// User imports 
import Login from './pages/auth/Login';
import UserLayout from './layouts/UserLayout';
import HomePage from './pages/user/HomePage';
import PlotDetail from './pages/user/PlotDetail';
import SocietiesPage from './pages/user/SocietiesPage';
import RegistrationForm from './pages/RegistrationForm/RegistrationForm';

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
        <Route path="/registration-form" element={<RegistrationForm />} />

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
          <Route path="floorPlan" element={<FloorPlanGenerator/>} /> 
          <Route path="approvals" element={<Approvals />} />
          <Route path="compliance" element={<ComplianceManagement />} />
          <Route path="society-profile" element={<SocietyProfile />} />
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
