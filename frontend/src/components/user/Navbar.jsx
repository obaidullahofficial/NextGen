import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo2.png';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="flex items-center justify-between p-6 px-8 bg-[#2F3D57] shadow-sm">
      <div className="flex items-center space-x-3">
        <img src={logo} alt="Logo" className="h-10 w-10" />
        <div className="text-2xl font-bold text-white">NextGenArchitect</div>
      </div>
      <div className="flex items-center space-x-8">
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
          to="/contact" 
          className={`font-medium transition-colors ${
            isActive('/contact') ? 'text-[#ED7600]' : 'text-gray-300 hover:text-[#ED7600]'
          }`}
        >
          Contact
        </Link>
        <Link 
          to="/login" 
          className="px-4 py-2 bg-[#ED7600] text-white rounded-md hover:bg-[#D56900] transition-colors font-medium"
        >
          Log in
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;