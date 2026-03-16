import { Link } from 'react-router-dom';
import { FaHome, FaBuilding, FaBook, FaMapMarkerAlt, FaCube, FaPhone, FaEnvelope, FaMapPin } from 'react-icons/fa';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import logo from '../../assets/logo2.png';

const Footer = () => {
  return (
    <footer className="bg-[#2F3D57] text-white py-12 px-6 border-t border-[#2F3D57]">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Info */}
          <div className="mb-8 md:mb-0">
            <div className="flex items-center space-x-3 mb-4">
              <img src={logo} alt="NextGenArchitect Logo" className="h-10 w-10" />
              <h2 className="text-2xl font-bold">NextGenArchitect</h2>
            </div>
            <p className="text-gray-300">
              Transform your architectural vision into reality with our comprehensive design and compliance platform.
            </p>
          </div>

          {/* Quick Links */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-xl font-semibold mb-4 text-[#ED7600] flex items-center">
              <HiOutlineBuildingLibrary className="mr-2" /> Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-300 hover:text-[#ED7600] transition-colors flex items-center">
                  <FaHome className="mr-2" /> Home
                </Link>
              </li>
              <li>
                <Link to="/society" className="text-gray-300 hover:text-[#ED7600] transition-colors flex items-center">
                  <FaBuilding className="mr-2" /> Societies
                </Link>
              </li>
              <li>
                <Link to="/society" className="text-gray-300 hover:text-[#ED7600] transition-colors flex items-center">
                  <FaMapMarkerAlt className="mr-2" /> Plot Selector
                </Link>
              </li>
              <li>
                <Link to="/floor-plan/generate" className="text-gray-300 hover:text-[#ED7600] transition-colors flex items-center">
                  <FaCube className="mr-2" /> 2D/3D Modelling
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-[#ED7600] flex items-center">
              <FaEnvelope className="mr-2" /> Contact Us
            </h3>
            <address className="not-italic text-gray-300 space-y-3">
              <p className="flex items-center">
                <FaMapPin className="mr-2 text-[#ED7600]" /> 123 Design Avenue
              </p>
              <p className="flex items-center ml-6">
                Architecture District, AD 12345
              </p>
              <p className="flex items-center">
                <FaPhone className="mr-2 text-[#ED7600]" /> +923005750363
              </p>
              <p className="flex items-center break-all">
                <FaEnvelope className="mr-2 text-[#ED7600] shrink-0" /> nextgenarchitect.support@gmail.com
              </p>
            </address>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#2F3D57] mt-8 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} NextGenArchitect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;