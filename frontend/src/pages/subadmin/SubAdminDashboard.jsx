import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import SubAdminPanel from "../../components/subadmin/SubAdminPanel";
import SubAdminTopBar from "../../components/subadmin/SubAdminTopBar";

const SubadminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sync activeTab with URL
  const getActiveTab = () => {
    if (location.pathname.includes('floorPlan')) return 'floorPlan';
    if (location.pathname.includes('approvals')) return 'approvals';
    if (location.pathname.includes('compliance')) return 'compliance';
    if (location.pathname.includes('advertisement')) return 'advertisement';
    if (location.pathname.includes('society-profile')) return 'society-profile';
    return 'plotManagement';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab) => {
    if (tab === 'society-profile') {
      navigate('/subadmin/society-profile');
    } else if (tab === 'advertisement') {
      navigate('/subadmin/advertisement');
    } else if (tab === 'floorPlan') {
      navigate('/subadmin/floorPlan');
    } else if (tab === 'compliance') {
      navigate('/subadmin/compliance');
    } else {
      navigate(`/subadmin/${tab === 'plotManagement' ? '' : tab}`);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-50">
      <SubAdminPanel activeTab={activeTab} setActiveTab={handleTabChange} />
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-white ml-0 lg:ml-0 w-full">
        <SubAdminTopBar />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default SubadminDashboard;

