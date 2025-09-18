import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiFileText, FiCalendar, FiUsers, FiBarChart2, FiSettings } from 'react-icons/fi';
import './Sidebar.css';
import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'GH';
  const displayName = user?.name || 'GSO Head';
  const displayRole = user?.role === 'personnel' ? 'Team Member' : 'Administrator';

  const sidebarRef = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;

    const update = () => {
      const shouldCompact = window.innerWidth <= 720;
      setCompact(shouldCompact);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <aside ref={sidebarRef} className={`sidebar ${compact ? 'compact' : ''}`}>
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
          <NavLink to="/profile" className="user-avatar-link">
            <div className="user-avatar">{initials}</div>
          </NavLink>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{displayRole}</span>
          </div>
        </div>

        <div className="sidebar-logout">
          <button className="btn btn-secondary logout-btn" onClick={logout} style={{ padding: '0.5rem', width: '100%', fontSize: '0.9rem' }}>Log out</button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;