import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX } from 'react-icons/fi';
import logo from '../../assets/logo2.png';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="flex items-center justify-between p-4 md:p-6 md:px-8 bg-[#2F3D57] shadow-sm relative z-[1000]">
      <div className="flex items-center space-x-3">
        <img src={logo} alt="Logo" className="h-8 w-8 md:h-10 md:w-10" />
        <div className="text-xl md:text-2xl font-bold text-white">NextGenArchitect</div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden text-white p-2"
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        <Link 
          to="/" 
          className={`font-medium transition-colors ${
            isActive('/') ? 'text-[#ED7600]' : 'text-gray-300 hover:text-[#ED7600]'
          }`}
        >
          Home
        </Link>
        <Link 
          to="/society" 
          className={`font-medium transition-colors ${
            isActive('/society') ? 'text-[#ED7600]' : 'text-gray-300 hover:text-[#ED7600]'
          }`}
        >
          Societies
        </Link>
        <Link 
          to="/about-us" 
          className={`font-medium transition-colors ${
            isActive('/about-us') ? 'text-[#ED7600]' : 'text-gray-300 hover:text-[#ED7600]'
          }`}
        >
          About Us
        </Link>
        
        {/* Show Profile Dropdown if logged in, otherwise show Login button */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              {/* Profile Picture */}
              {user.profileImage ? (
                <img 
                  src={https://nextgen-ta95.onrender.com/api/file/${user.profileImage.replace(/^https://nextgen-ta95.onrender.com/api//, '')}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white hover:border-[#ED7600] transition-colors cursor-pointer"
                  onError={(e) => {
                    console.error('Image failed to load:', user.profileImage);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              {!user.profileImage || true ? (
                <div 
                  className="w-10 h-10 rounded-full bg-[#ED7600] flex items-center justify-center text-white font-bold border-2 border-white hover:border-[#ED7600] transition-colors cursor-pointer"
                  style={{ display: user.profileImage ? 'none' : 'flex' }}
                >
                  {user.firstName 
                    ? user.firstName.charAt(0).toUpperCase() 
                    : user.username 
                      ? user.username.charAt(0).toUpperCase() 
                      : user.email.charAt(0).toUpperCase()}
                </div>
              ) : null}
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-[9999] border border-gray-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>

                {/* Profile Menu Items */}
                <Link
                  to="/userprofile?tab=personalInfo"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3 text-[#ED7600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </Link>

                <Link
                  to="/userprofile?tab=approvalRequests"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3 text-[#ED7600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Activity
                </Link>

                <Link
                  to="/userprofile?tab=progress"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3 text-[#ED7600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  My Progress
                </Link>

                <Link
                  to="/userprofile?tab=approvalRequest"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3 text-[#ED7600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Approval Request
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-200 my-2"></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            to="/login" 
            className="px-4 py-2 bg-[#ED7600] text-white rounded-md hover:bg-[#D56900] transition-colors font-medium"
          >
            Log in
          </Link>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#2F3D57] shadow-lg z-[9999] border-t border-gray-600">
          <div className="flex flex-col p-4 space-y-2">
            <Link 
              to="/" 
              onClick={closeMobileMenu}
              className={`px-4 py-3 rounded-md font-medium transition-colors ${
                isActive('/') ? 'bg-[#ED7600] text-white' : 'text-gray-300 hover:bg-[#ED7600] hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/society" 
              onClick={closeMobileMenu}
              className={`px-4 py-3 rounded-md font-medium transition-colors ${
                isActive('/society') ? 'bg-[#ED7600] text-white' : 'text-gray-300 hover:bg-[#ED7600] hover:text-white'
              }`}
            >
              Societies
            </Link>
            <Link 
              to="/about-us" 
              onClick={closeMobileMenu}
              className={`px-4 py-3 rounded-md font-medium transition-colors ${
                isActive('/about-us') ? 'bg-[#ED7600] text-white' : 'text-gray-300 hover:bg-[#ED7600] hover:text-white'
              }`}
            >
              About Us
            </Link>
            
            {user ? (
              <>
                <div className="border-t border-gray-600 my-2"></div>
                <Link 
                  to="/userprofile?tab=personalInfo" 
                  onClick={closeMobileMenu}
                  className="px-4 py-3 rounded-md text-gray-300 hover:bg-[#ED7600] hover:text-white transition-colors"
                >
                  Personal Information
                </Link>
                <Link 
                  to="/userprofile?tab=approvalRequests" 
                  onClick={closeMobileMenu}
                  className="px-4 py-3 rounded-md text-gray-300 hover:bg-[#ED7600] hover:text-white transition-colors"
                >
                  Activity
                </Link>
                <Link 
                  to="/userprofile?tab=progress" 
                  onClick={closeMobileMenu}
                  className="px-4 py-3 rounded-md text-gray-300 hover:bg-[#ED7600] hover:text-white transition-colors"
                >
                  My Progress
                </Link>
                <Link 
                  to="/userprofile?tab=approvalRequest" 
                  onClick={closeMobileMenu}
                  className="px-4 py-3 rounded-md text-gray-300 hover:bg-[#ED7600] hover:text-white transition-colors"
                >
                  Approval Request
                </Link>
                <button
                  onClick={() => { handleLogout(); closeMobileMenu(); }}
                  className="px-4 py-3 rounded-md text-left text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                onClick={closeMobileMenu}
                className="px-4 py-3 bg-[#ED7600] text-white text-center rounded-md hover:bg-[#D56900] transition-colors font-medium"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
