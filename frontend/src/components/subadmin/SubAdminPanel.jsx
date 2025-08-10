import {
  FiHome,
  FiLayers,
  FiCheckSquare,
  FiShield,
  FiUsers,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';

const SubAdminPanel = ({ activeTab, setActiveTab }) => {
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-[#2F3D57] text-white flex flex-col z-10">
      <div className="p-6 text-2xl font-bold border-b border-gray-700">
        Societies Dashboard
      </div>
  <nav className="flex flex-col mt-6 space-y-1 flex-grow">
        <button
          onClick={() => handleTabClick('society-profile')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'society-profile' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiUsers className="mr-3 text-lg" />
          Society Profile
        </button>
        <button
          onClick={() => handleTabClick('plotManagement')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'plotManagement' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiHome className="mr-3 text-lg" />
          Plot Management
        </button>
        <button
          onClick={() => handleTabClick('floorPlan')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'floorPlan' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiLayers className="mr-3 text-lg" />
          Generate Floor Plan
        </button>
        <button
          onClick={() => handleTabClick('approvals')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'approvals' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiCheckSquare className="mr-3 text-lg" />
          Approvals Requests
        </button>
        <button
          onClick={() => handleTabClick('compliance')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'compliance' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiShield className="mr-3 text-lg" />
          Compliance Management
        </button>
        
        {/* Bottom-aligned items */}
        <div className="mt-auto">
          <div className="border-t border-gray-700"></div>
          <button
            onClick={() => handleTabClick('settings')}
            className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
              activeTab === 'settings' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
            }`}
          >
            <FiSettings className="mr-3 text-lg" />
            Settings
          </button>
          <button
            onClick={() => console.log('Logout')}
            className="flex items-center px-6 py-3 text-left w-full text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <FiLogOut className="mr-3 text-lg" />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default SubAdminPanel;