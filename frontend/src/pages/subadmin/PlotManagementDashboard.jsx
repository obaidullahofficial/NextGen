// SubadminDashboard.js
import React from "react";
import SubAdminPanel from "../pages/subadmin/SubAdminPanel";
import AddPlot from "../pages/subadmin/AddPlot";

const PlotManagementDashboard = () => {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Sidebar - fixed width with no spacing */}
      <div className="w-[256px] h-full">
        <SubAdminPanel className="h-full" />
      </div>

      {/* Main Content - fills remaining space */}
      <div className="flex-1 h-full overflow-auto bg-white">
        <AddPlot className="h-full" />
      </div>
    </div>
  );
};

export default PlotManagementDashboard;
