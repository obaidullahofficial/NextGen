import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import SubAdminPanel from "../../components/subadmin/SubAdminPanel";

const SubadminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sync activeTab with URL
  const getActiveTab = () => {
    if (location.pathname.includes('floorPlan')) return 'floorPlan';
    if (location.pathname.includes('approvals')) return 'approvals';
    if (location.pathname.includes('compliance')) return 'compliance';
    if (location.pathname.includes('society-profile')) return 'society-profile';
    return 'plotManagement';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab) => {
    if (tab === 'society-profile') {
      navigate('/subadmin/society-profile');
    } else {
      navigate(`/subadmin/${tab === 'plotManagement' ? '' : tab}`);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <div className="w-[256px] h-full">
        <SubAdminPanel activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
      <div className="flex-1 h-full overflow-auto bg-white">
        <Outlet />
      </div>
    </div>
  );
};
export default SubadminDashboard;


