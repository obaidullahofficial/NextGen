import {
  FiHome,
  FiLayers,
  FiCheckSquare,
  FiShield,
  FiUsers,
  FiLogOut,
  FiFlag
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo2.png';

const SubAdminPanel = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const handleTabClick = (tab) => {
    if (tab === 'floorPlan') {
      navigate('/floor-plan/generate');
    } else {
      setActiveTab(tab);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Clear any local storage items if needed
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-[#2F3D57] text-white flex flex-col z-10">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-8 w-8" />
          <div className="text-xl font-bold text-white">NextGenArchitect</div>
        </div>
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
        <button
          onClick={() => handleTabClick('advertisement')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'advertisement' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiFlag className="mr-3 text-lg" />
          Advertisements
        </button>
        
        {/* Bottom-aligned items */}
        <div className="mt-auto">
          <div className="border-t border-gray-700"></div>
          <button
            onClick={handleLogout}
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