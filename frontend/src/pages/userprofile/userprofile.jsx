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
        w-full h-screen bg-[#2F3D57] text-white flex flex-col sticky top-0 overflow-y-auto
        fixed lg:sticky left-0 z-40
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-8 w-8" />
          <div className="text-xl font-bold text-white">NextGenArchitect</div>
        </div>
        <div className="text-sm text-gray-300 mt-2">User Profile</div>
      </div>
      <nav className="flex flex-col mt-6 space-y-1 flex-1">
        {/* Your navigation buttons */}
        <button
          onClick={() => handleTabClick('personalInfo')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'personalInfo' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiUser className="mr-3 text-lg" />
          Personal Information
        </button>

                {/* Activity Button */}

        <button
          onClick={() => handleTabClick('approvalRequests')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'approvalRequests' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiCheckSquare className="mr-3 text-lg" />
          Activity    
        </button>

               {/*  My Progress Button  */}
               
        <button
          onClick={() => handleTabClick('progress')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'progress' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiClipboard className="mr-3 text-lg" />
          My Progress
        </button>

        {/*  Approval Request Button */}
        <button

          onClick={() => handleTabClick('approvalRequest')}
          className={`flex items-center px-6 py-3 text-left w-full hover:bg-[#ED7600] hover:text-white transition-colors ${
            activeTab === 'approvalRequest' ? 'bg-[#ED7600] text-white font-semibold' : 'text-gray-300'
          }`}
        >
          <FiSend className="mr-3 text-lg" />
          Approval Request
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
    </>
  );
};

export default UserProfile;