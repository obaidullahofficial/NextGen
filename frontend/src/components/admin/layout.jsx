import React from "react";
import { Bell, UserCircle } from "lucide-react";

const NavBar = () => (
  <nav
    className="w-full text-white flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 shadow-md sticky top-0 z-50"
    style={{ backgroundColor: "#2f3d57" }}
  >
    <div className="text-lg sm:text-xl font-bold">Admin Dashboard</div>
    <div className="flex items-center gap-4">
      <Bell className="w-5 h-5 sm:w-6 sm:h-6 hover:text-gray-300 cursor-pointer" title="Notifications" />
      <UserCircle className="w-7 h-7 sm:w-8 sm:h-8 hover:text-gray-300 cursor-pointer" title="Profile" />
    </div>
  </nav>
);

const Layout = ({ children }) => (
  <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
    <NavBar />
    <main className="flex-1 w-full p-4 sm:p-6">{children}</main>
  </div>
);

export default Layout;
