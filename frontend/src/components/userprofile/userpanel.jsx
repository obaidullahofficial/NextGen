import React from 'react';
import PersonalInfoForm from './personalInfoForm';
import UserDesignStatus from './UserDesignStatus';
import MyProgress from './MyProgress';
import ApprovalRequestForm from './ApprovalRequestForm';
import Activity from './Activity';

//const UserPanel = ({ activeTab, personalInfo, approvalRequests, history }) 
const UserPanel = ({ activeTab,  approvalRequests,  }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'personalInfo':
        return <PersonalInfoForm />;
      case 'approvalRequests':
        return <Activity />;
      case 'progress':
        return <MyProgress />;
      case 'approvalRequest':
        return <ApprovalRequestForm />;
      case 'settings':
        return (
          <div className="p-8">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
          </div>
        );
      default:
        return <div className="p-8">Select a tab</div>;
    }
  };

  return (
    <div className="h-full w-full">
      {renderContent()}
    </div>
  );
};

export default UserPanel;
