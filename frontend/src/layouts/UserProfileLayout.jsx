import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserProfile from '../pages/userprofile/userprofile';
import UserPanel from '../components/userprofile/userpanel';

const UserProfileLayout = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'personalInfo';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Dummy data for demonstration
  const personalInfo = {};
  const approvalRequests = [];
  const history = { generated: 0, purchased: 0 };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-80 min-w-[280px] h-full overflow-y-auto border-r border-gray-200 bg-white shadow-xl flex-shrink-0">
        <UserProfile activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        <UserPanel
          activeTab={activeTab}
          personalInfo={personalInfo}
          approvalRequests={approvalRequests}
          history={history}
        />
      </main>
    </div>
  );
};

export default UserProfileLayout;
