import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiFileText, FiCalendar, FiUsers, FiBarChart2, FiSettings } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-header">
           {/* <img src="/src/assets/GSUS_logo.svg" alt="GSUS Logo" className="logo-img"/> */}
           <h1 className="logo-text">GSUS</h1>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="nav-item"><FiGrid /> Dashboard</NavLink>
          <NavLink to="/requests" className="nav-item"><FiFileText /> All Requests</NavLink>
          <NavLink to="/calendar" className="nav-item"><FiCalendar /> Master Calendar</NavLink>
          <NavLink to="/personnel" className="nav-item"><FiUsers /> Personnel</NavLink>
          <NavLink to="/analytics" className="nav-item"><FiBarChart2 /> Analytics</NavLink>
          <NavLink to="/settings" className="nav-item"><FiSettings /> Settings</NavLink>
        </nav>
      </div>
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">GH</div>
          <div className="user-info">
            <span className="user-name">GSO Head</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;