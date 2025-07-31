import { Link } from 'react-router-dom';
import logo from '../../assets/logo2.png';

const Navbar = () => {
  return (
    <footer className="flex items-center justify-between p-6 px-8 bg-[#2F3D57] shadow-sm mt-auto">
      <div className="flex items-center space-x-3">
        <img src={logo} alt="Logo" className="h-10 w-10" />
        <div className="text-2xl font-bold text-white">NextGenArchitect</div>
      </div>
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-[#ED7600] font-medium">Home</Link>
        <Link to="/society" className="text-gray-300 hover:text-[#ED7600] transition-colors">Societies</Link>
        <Link to="/contact" className="text-gray-300 hover:text-[#ED7600] transition-colors">Contact</Link>
        <Link to="/login" className="px-4 py-2 bg-[#ED7600] text-white rounded-md hover:bg-[#D56900] transition-colors">
          Log in
        </Link>
      </div>
    </footer>
  );
};

export default Navbar;