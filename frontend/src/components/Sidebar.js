import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicService } from '../services/complaintService';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (user?.role === 'CITIZEN') {
      return [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/complaints', icon: '📝', label: 'My Complaints' },
        { path: '/complaints/new', icon: '➕', label: 'New Complaint' },
        { path: '/community', icon: '🏘️', label: 'Community Feed' },
        { path: '/notices', icon: '📢', label: 'Notices' }
      ];
    }

    if (user?.role === 'ADMIN') {
      const base = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/complaints', icon: '📋', label: 'Manage Complaints' },
        { path: '/admin/notices', icon: '📢', label: 'Notices' },
      ];
      if (user.level === 1) {
        return [
          ...base,
          { path: '/performance/my-score', icon: '📈', label: 'My Performance' }
        ];
      }
      if (user.level === 2) {
        // Level 2: Full access - sees overdue complaints + analytics
        return [
          { path: '/dashboard', icon: '📊', label: 'Dashboard' },
          { path: '/admin/manual-escalations', icon: '🔺', label: 'Escalated Issues' },
          { path: '/admin/complaints', icon: '📋', label: 'Overdue Complaints' },
          { path: '/performance', icon: '📈', label: 'Officer Performance' },
          { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
          { path: '/admin/notices', icon: '📢', label: 'Notices' },
        ];
      }
      if (user.level === 3) {
        // District Analyst — analytics-only, no complaint management
        return [
          { path: '/dashboard', icon: '📊', label: 'Dashboard' },
          { path: '/performance', icon: '📈', label: 'Performance Analytics' },
          { path: '/admin/analytics', icon: '📈', label: 'District Analytics' },
          { path: '/admin/notices', icon: '📢', label: 'Notices' },
        ];
      }
      // Default admin
      return base;
    }

    if (user?.role === 'GOVERNMENT_ANALYST' || user?.role === 'SUPER_ADMIN') {
      return [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/analytics', icon: '📈', label: 'Analytics' },
        { path: '/performance', icon: '📈', label: 'Officer Performance' },
        { path: '/complaints', icon: '📋', label: 'All Complaints' },
        { path: '/notices', icon: '📢', label: 'Notices' }
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  const citizenLocationText = user?.role === 'CITIZEN'
    ? [user?.geographic_unit_id?.name, user?.address?.street, user?.address?.landmark, user?.address?.pincode]
      .filter(Boolean)
      .join(', ')
    : '';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>CivicConnect</h2>
          {user?.role === 'ADMIN' && user?.level && (
            <span className="admin-level-badge">Level {user.level}</span>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">
                {user?.role === 'ADMIN' && user?.designation
                  ? user.designation
                  : user?.role?.replace('_', ' ')}
              </div>
              {user?.role === 'CITIZEN' && citizenLocationText && (
                <div className="user-location">{citizenLocationText}</div>
              )}
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
