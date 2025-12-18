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
    <div className="flex flex-col lg:flex-row w-full h-screen overflow-hidden bg-gray-50">
      <div className="lg:w-64 h-full">
        <UserProfile activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <main className="flex-1 h-full flex flex-col overflow-hidden bg-white w-full lg:w-auto">
        <div className="flex-1 overflow-auto">
          <UserPanel
            activeTab={activeTab}
            personalInfo={personalInfo}
            approvalRequests={approvalRequests}
            history={history}
          />
        </div>
      </main>
    </div>
  );
};

export default UserProfileLayout;