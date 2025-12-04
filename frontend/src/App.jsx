import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import GoogleOAuthProvider from './components/auth/GoogleOAuthProvider';
import { AdminDataProvider } from './context/AdminDataContext';

// Subadmin imports 
import SubadminDashboard from './pages/subadmin/SubAdminDashboard';
import SocietyProfile from './pages/subadmin/SocietyProfile';
import SocietyProfileSetup from './pages/subadmin/SocietyProfileSetup';
import SocietyProfileEdit from './pages/subadmin/SocietyProfileEdit';
import PlotManager from './pages/subadmin/PlotManager';
import Approvals from './pages/subadmin/Approvals';
import ComplianceManagement from './pages/subadmin/ComplianceManagement';
import FloorPlanGenerator from './pages/subadmin/FloorPlanGenerator';
import Advertisement from './pages/subadmin/Advertisement';
import ProtectedSubAdminRoute from './components/common/ProtectedSubAdminRoute';
import ProtectedAdminRoute from './components/common/ProtectedAdminRoute';

// User imports 
import Login from './pages/auth/Login';
import EmailVerification from './pages/auth/EmailVerification';
import UserLayout from './layouts/UserLayout';
import HomePage from './pages/user/HomePage';
import PlotDetail from './pages/user/PlotDetail';
import SocietiesPage from './pages/user/SocietiesPage';
import RegistrationForm from './pages/RegistrationForm/RegistrationForm';
import UserProfileLayout from './layouts/UserProfileLayout';
import SocietyPlots from "./pages/user/SocietyPlots";
import GenerateFloorPlan from './pages/user/GenerateFloorPlan';
import OffersPage from './pages/user/OffersPage';
import { FloorPlanGenerator as FloorPlanGen } from './pages/FloorPlanGeneration';
import FloorPlanCustomization from './pages/FloorPlanGeneration/FloorPlanCustomization';

// Admin imports
import Sidebar from "./components/admin/sidebar";
import Layout from "./components/admin/layout";
import Dashboard from "./pages/admin/dashboard";
import UserManagementDashboard from "./pages/admin/userManagementDashboard";
import SocietyManagement from "./pages/admin/SocietyManagement";
import ReviewManagement from "./pages/admin/ReviewManagement";  
import ReportManagement from "./pages/admin/ReportManagement";
import AdvertisementManagement from "./pages/admin/AdvertisementManagement";
import AdvertisementPlanManagement from "./pages/admin/AdvertisementPlanManagement";

// Wrapper for Admin Layout with Sidebar + Topbar + Data Context
const AdminLayout = ({ children }) => (
  <AdminDataProvider>
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Layout>{children}</Layout>
      </div>
    </div>
  </AdminDataProvider>
);

function App() {
  return (
    <GoogleOAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* User Profile */}
          <Route path="/userprofile" element={<UserProfileLayout />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/registration-form" element={<RegistrationForm />} />

          {/* Society Profile Standalone */}
          <Route path="/society-profile-setup" element={<SocietyProfileSetup />} />
          <Route path="/society-profile-edit" element={<SocietyProfileEdit />} />

          {/* Floor Plan Generation */}
          <Route path="/floor-plan/generate" element={<FloorPlanGen />} />
          <Route path="/floor-plan/customize" element={<FloorPlanCustomization />} />

          {/* User Routes */}
          <Route path="/" element={<UserLayout />}>
            <Route index element={<HomePage />} />
            <Route path="societies/:societyId/plots/:plotId" element={<PlotDetail />} />
            <Route path="society" element={<SocietiesPage />} />
            <Route path="societies/:societyId/plots" element={<SocietyPlots />} />
            <Route path="generate-floor-plan/:societyId/:plotId" element={<GenerateFloorPlan />} />
            <Route path="offers" element={<OffersPage />} />
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
            <Route path="advertisement" element={<Advertisement />} />
            <Route path="society-profile" element={<SocietyProfile />} />
          </Route>

          {/* Admin Routes - Protected */}
          <Route path="/dashboard" element={
            <ProtectedAdminRoute>
              <AdminLayout><Dashboard /></AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/UserManagementDashboard" element={
            <ProtectedAdminRoute>
              <AdminLayout><UserManagementDashboard /></AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/society-management" element={
            <ProtectedAdminRoute>
              <AdminLayout><SocietyManagement /></AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/review-management" element={
            <ProtectedAdminRoute>
              <AdminLayout><ReviewManagement /></AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/advertisement-management" element={
            <ProtectedAdminRoute>
              <AdminLayout><AdvertisementManagement /></AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/advertisement-plan-management" element={
            <ProtectedAdminRoute>
              <AdminLayout><AdvertisementPlanManagement /></AdminLayout>
            </ProtectedAdminRoute>
          } />
          <Route path="/reports" element={
            <ProtectedAdminRoute>
              <AdminLayout><ReportManagement /></AdminLayout>
            </ProtectedAdminRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;