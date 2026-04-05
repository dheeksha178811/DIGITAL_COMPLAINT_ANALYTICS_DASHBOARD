import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatBot from '../components/ChatBot';
import './AuthenticatedLayout.css';

const AuthenticatedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="authenticated-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Header toggleSidebar={toggleSidebar} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      <ChatBot />
    </div>
  );
};

export default AuthenticatedLayout;
