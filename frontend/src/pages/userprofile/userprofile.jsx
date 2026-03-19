import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  FiUser,
  FiCheckSquare,
  FiClock,
  FiClipboard, 
  FiSend,
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi';
import logo from '../../assets/logo2.png';

const UserProfile = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(`/userprofile?tab=${tab}`);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#2F3D57] text-white"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-full h-screen bg-gradient-to-b from-[#1e293b] to-[#2F3D57] text-white flex flex-col sticky top-0 overflow-y-auto
        fixed lg:sticky left-0 z-40
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-2xl
      `}>
      <div className="p-8 border-b border-gray-600">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg shadow-lg" />
          <div>
            <div className="text-xl font-bold text-white">NextGenArchitect</div>
          </div>
        </div>
      </div>
      <nav className="flex flex-col mt-8 space-y-2 flex-1 px-4">
        {/* Your navigation buttons */}
        <button
          onClick={() => handleTabClick('personalInfo')}
          className={`flex items-center px-6 py-4 text-left w-full rounded-xl mb-2 transition-all duration-200 shadow-md ${
            activeTab === 'personalInfo' 
              ? 'bg-gradient-to-r from-[#ED7600] to-[#f59e0b] text-white font-semibold shadow-lg transform scale-105' 
              : 'text-gray-300 hover:bg-slate-700 hover:text-white hover:shadow-lg'
          }`}
        >
          <FiUser className="mr-4 text-xl" />
          <span className="font-medium">Personal Information</span>
        </button>

        <button
          onClick={() => handleTabClick('approvalRequests')}
          className={`flex items-center px-6 py-4 text-left w-full rounded-xl mb-2 transition-all duration-200 shadow-md ${
            activeTab === 'approvalRequests' 
              ? 'bg-gradient-to-r from-[#ED7600] to-[#f59e0b] text-white font-semibold shadow-lg transform scale-105' 
              : 'text-gray-300 hover:bg-slate-700 hover:text-white hover:shadow-lg'
          }`}
        >
          <FiCheckSquare className="mr-4 text-xl" />
          <span className="font-medium">Activity</span>
        </button>
               
        <button
          onClick={() => handleTabClick('progress')}
          className={`flex items-center px-6 py-4 text-left w-full rounded-xl mb-2 transition-all duration-200 shadow-md ${
            activeTab === 'progress' 
              ? 'bg-gradient-to-r from-[#ED7600] to-[#f59e0b] text-white font-semibold shadow-lg transform scale-105' 
              : 'text-gray-300 hover:bg-slate-700 hover:text-white hover:shadow-lg'
          }`}
        >
          <FiClipboard className="mr-4 text-xl" />
          <span className="font-medium">My Progress</span>
        </button>

        <button
          onClick={() => handleTabClick('approvalRequest')}
          className={`flex items-center px-6 py-4 text-left w-full rounded-xl mb-2 transition-all duration-200 shadow-md ${
            activeTab === 'approvalRequest' 
              ? 'bg-gradient-to-r from-[#ED7600] to-[#f59e0b] text-white font-semibold shadow-lg transform scale-105' 
              : 'text-gray-300 hover:bg-slate-700 hover:text-white hover:shadow-lg'
          }`}
        >
          <FiSend className="mr-4 text-xl" />
          <span className="font-medium">Approval Request</span>
        </button>

        {/* Bottom-aligned items */}
        <div className="mt-auto mb-6">
          <div className="border-t border-gray-600 mb-6 mx-2"></div>
          <button
            onClick={handleLogout}
            className="flex items-center px-6 py-4 text-left w-full rounded-xl transition-all duration-200 text-red-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-700 hover:text-white hover:shadow-lg transform hover:scale-105"
          >
            <FiLogOut className="mr-4 text-xl" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
    </>
  );
};

export default UserProfile;
