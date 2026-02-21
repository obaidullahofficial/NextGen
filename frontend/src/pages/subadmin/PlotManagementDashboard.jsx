// SubadminDashboard.js
import React from "react";
import SubAdminPanel from "../pages/subadmin/SubAdminPanel";


const PlotManagementDashboard = () => {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Sidebar - fixed width with no spacing */}
      <div className="w-[256px] h-full">
        <SubAdminPanel className="h-full" />
      </div>

      
    </div>
  );
};

export default PlotManagementDashboard;
