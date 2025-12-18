import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import GoogleOAuthProvider from './components/auth/GoogleOAuthProvider';
import { AdminDataProvider } from './context/AdminDataContext';
import RoleBasedRoute from './components/common/RoleBasedRoute';
import UserOnlyRoute from './components/common/UserOnlyRoute';

// Subadmin imports 
import SubadminDashboard from './pages/subadmin/SubAdminDashboard';
import SocietyProfile from './pages/subadmin/SocietyProfile';
import SocietyProfileSetup from './pages/subadmin/SocietyProfileSetup';
import SocietyProfileEdit from './pages/subadmin/SocietyProfileEdit';
import PlotManager from './pages/subadmin/PlotManager';
import Approvals from './pages/subadmin/Approvals';
import ComplianceManagement from './components/subadmin/ComplianceManagement';
import FloorPlanManager from './pages/subadmin/FloorPlanManager';
import Advertisement from './pages/subadmin/Advertisement';
import ProtectedSubAdminRoute from './components/common/ProtectedSubAdminRoute';
import ProtectedAdminRoute from './components/common/ProtectedAdminRoute';

// User imports 
import Login from './pages/auth/Login';
import EmailVerification from './pages/auth/EmailVerification';
import Unauthorized from './pages/auth/Unauthorized';
import UserLayout from './layouts/UserLayout';
import HomePage from './pages/user/HomePage';
import PlotDetail from './pages/user/PlotDetail';
import SocietiesPage from './pages/user/SocietiesPage';
import RegistrationForm from './pages/RegistrationForm/RegistrationForm';
import UserProfileLayout from './layouts/UserProfileLayout';
import SocietyPlots from "./pages/user/SocietyPlots";
import GenerateFloorPlan from './pages/user/GenerateFloorPlan';
import FloorPlanStart from './pages/user/FloorPlanStart';
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

// Payment imports
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentCancel from './pages/payment/PaymentCancel';

// Wrapper for Admin Layout with Sidebar + Topbar + Data Context
const AdminLayout = ({ children }) => (
  <AdminDataProvider>
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full lg:w-auto overflow-x-hidden">
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
          {/* User Profile - User Only */}
          <Route path="/userprofile" element={
            <RoleBasedRoute allowedRoles={['user']}>
              <UserProfileLayout />
            </RoleBasedRoute>
          } />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/registration-form" element={
            <RoleBasedRoute allowedRoles={['society']}>
              <RegistrationForm />
            </RoleBasedRoute>
          } />

          {/* Payment Routes - Protected */}
          <Route path="/payment-success" element={
            <RoleBasedRoute allowedRoles={['society']}>
              <PaymentSuccess />
            </RoleBasedRoute>
          } />
          <Route path="/payment-cancelled" element={
            <RoleBasedRoute allowedRoles={['society']}>
              <PaymentCancel />
            </RoleBasedRoute>
          } />

          {/* Society Profile Standalone - SubAdmin Only */}
          <Route path="/society-profile-setup" element={
            <RoleBasedRoute allowedRoles={['society', 'subadmin']}>
              <SocietyProfileSetup />
            </RoleBasedRoute>
          } />
          <Route path="/society-profile-edit" element={
            <RoleBasedRoute allowedRoles={['society', 'subadmin']}>
              <SocietyProfileEdit />
            </RoleBasedRoute>
          } />

          {/* Floor Plan Generation - User Only */}
          <Route path="/floor-plan/generate" element={
            <RoleBasedRoute allowedRoles={['user','society']}>
              <FloorPlanGen />
            </RoleBasedRoute>
          } />
          <Route path="/floor-plan/customize" element={
            <RoleBasedRoute allowedRoles={['user','society']}>
              <FloorPlanCustomization />
            </RoleBasedRoute>
          } />

          {/* User Routes - Restricted to regular users only */}
          <Route path="/" element={
            <UserOnlyRoute>
              <UserLayout />
            </UserOnlyRoute>
          }>
            <Route index element={<HomePage />} />
            <Route path="societies/:societyId/plots/:plotId" element={<PlotDetail />} />
            <Route path="society" element={<SocietiesPage />} />
            <Route path="societies/:societyId/plots" element={<SocietyPlots />} />
            <Route path="user/society/:societyId/plot/:plotId/templates" element={<FloorPlanStart />} />
            <Route path="user/society/:societyId/plot/:plotId/generate" element={<GenerateFloorPlan />} />
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
            <Route path="floorPlan" element={<FloorPlanManager />} /> 
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

          {/* Unauthorized Access */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Catch-all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
