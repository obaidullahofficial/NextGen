import React from 'react';
import { Outlet } from 'react-router-dom';

const UserLayout = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Outlet renders the child routes */}
      <Outlet />
    </div>
  );
};

export default UserLayout;
