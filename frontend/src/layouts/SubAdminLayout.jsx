import { useState } from 'react';
import SidePanel from '../components/subadmin/SubAdminPanel';
import { Outlet } from 'react-router-dom';

const SubAdminLayout = () => {
  const [activeTab, setActiveTab] = useState('plotManagement');

  return (
    <div className="flex h-screen bg-gray-100">
      <SidePanel activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto ml-64 p-6">
        <Outlet /> {/* This renders the matched child route */}
      </main>
    </div>
  );
};

export default SubAdminLayout;