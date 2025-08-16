import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Subadmin imports 
import SubadminDashboard from './pages/subadmin/SubAdminDashboard';
import SocietyProfile from './pages/subadmin/SocietyProfile';
import SocietyProfileSetup from './pages/subadmin/SocietyProfileSetup';
import SocietyProfileEdit from './pages/subadmin/SocietyProfileEdit';
import PlotManager from './pages/subadmin/PlotManager';
import Approvals from './pages/subadmin/Approvals';
import ComplianceManagement from './pages/subadmin/ComplianceManagement';
import FloorPlanGenerator from './pages/subadmin/FloorPlanGenerator';
import ProtectedSubAdminRoute from './components/common/ProtectedSubAdminRoute';

// User imports 
import Login from './pages/auth/Login';
import UserLayout from './layouts/UserLayout';
import HomePage from './pages/user/HomePage';
import PlotDetail from './pages/user/PlotDetail';
import SocietiesPage from './pages/user/SocietiesPage';
import RegistrationForm from './pages/RegistrationForm/RegistrationForm';
import UserProfileLayout from './layouts/UserProfileLayout';
import SocietyPlots from "./pages/user/SocietyPlots";
import GenerateFloorPlan from './pages/user/GenerateFloorPlan';

// Admin imports are here 
import Sidebar from "./components/admin/sidebar";
import Layout from "./components/admin/layout";
import Dashboard from "./pages/admin/dashboard";
import UserManagementDashboard from "./pages/admin/userManagementDashboard";
import SocietyManagement from "./pages/admin/SocietyManagement";
import ReviewManagement from "./pages/admin/ReviewManagement";  
import ReportManagement from "./pages/admin/ReportManagement";
import AdvertisementManagement from "./pages/admin/AdvertisementManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/userprofile" element={<UserProfileLayout />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/registration-form" element={<RegistrationForm />} />

        {/* Society Profile Standalone Routes */}
        <Route path="/society-profile-setup" element={<SocietyProfileSetup />} />
        <Route path="/society-profile-edit" element={<SocietyProfileEdit />} />

        {/* User Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="societies/:societyId/plots/:plotId" element={<PlotDetail />} />
          <Route path="society" element={<SocietiesPage />} />
          <Route path="societies/:societyId/plots" element={<SocietyPlots />} />
          <Route path="generate-floor-plan/:societyId/:plotId" element={<GenerateFloorPlan />} />
        </Route>

        {/* Subadmin Routes - Protected */}
        <Route path="/subadmin" element={
          <ProtectedSubAdminRoute>
            <SubadminDashboard />
          </ProtectedSubAdminRoute>
        }>
          <Route index element={<PlotManager />} />
          <Route path="plotManagement" element={<PlotManager />} />
          <Route path="floorPlan" element={<FloorPlanGenerator />} /> 
          <Route path="approvals" element={<Approvals />} />
          <Route path="compliance" element={<ComplianceManagement />} />
          <Route path="society-profile" element={<SocietyProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <div className="flex">
            <Sidebar />
            <div className="flex-1">
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="userManagementDashboard" element={<UserManagementDashboard />} />
                  <Route path="society-management" element={<SocietyManagement />} />
                  <Route path="review-management" element={<ReviewManagement />} />
                  <Route path="advertisement-management" element={<AdvertisementManagement />} />
                  <Route path="reports" element={<ReportManagement />} />
                </Routes>
              </Layout>
            </div>
          </div>
        } />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
