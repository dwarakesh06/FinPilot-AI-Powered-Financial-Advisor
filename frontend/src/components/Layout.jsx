import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />

      {/* Main Panel Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden md:pl-64">
        {/* Top Header Navbar */}
        <Navbar toggleSidebar={setSidebarOpen} />

        {/* Dynamic Workspace Outlet */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
