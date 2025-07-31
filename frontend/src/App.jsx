import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/subadmin" element={<SubadminDashboard />}>
          <Route index element={<PlotManager />} />
          <Route path="plotManagement" element={<PlotManager />} />
          <Route path="floorPlan" element={<div>Floor Plan Component</div>} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="compliance" element={<ComplianceManagement />} />
        </Route>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
         {/* User Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="plot-detail/" element={<PlotDetail />} />
          <Route path="society" element={<SocietiesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App; 