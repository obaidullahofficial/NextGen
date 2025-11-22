import React, { useState } from 'react';
import UserProfile from '../pages/userprofile/userprofile';
import UserPanel from '../components/userprofile/userpanel';

const UserProfileLayout = () => {
  const [activeTab, setActiveTab] = useState('personalInfo');

  // Dummy data for demonstration
  const personalInfo = {};
  const approvalRequests = [];
  const history = { generated: 0, purchased: 0 };

  return (
    <div className="flex h-screen">
      <UserProfile activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow bg-gray-100">
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