// src/components/PersonnelSidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiFileText, FiCalendar, FiUser } from 'react-icons/fi';
import './Sidebar.css'; // We can reuse the same styles
import { useAuth } from '../hooks/useAuth'; // <-- added

const PersonnelSidebar = () => {
    const { user, logout } = useAuth();
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'PT';
    const displayName = user?.name || 'Personnel';
    const displayRole = user?.role === 'personnel' ? 'Team Member' : (user?.role || 'Personnel');

    return (
        <aside className="sidebar">
            <div>
                <div className="sidebar-header">
                   <h1 className="logo-text">GSUS</h1>
                </div>
                <nav className="sidebar-nav">
                  <NavLink to="/my-tasks" className="nav-item"><FiFileText /> My Tasks</NavLink>
                  <NavLink to="/my-schedule" className="nav-item"><FiCalendar /> My Schedule</NavLink>
                  <NavLink to="/profile" className="nav-item"><FiUser /> Profile</NavLink>
                </nav>
            </div>
            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="user-avatar">{initials}</div>
                    <div className="user-info">
                        <span className="user-name">{displayName}</span>
                        <span className="user-role">{displayRole}</span>
                        <div style={{marginTop: '8px'}}>
                          <button className="btn btn-secondary" onClick={logout} style={{padding: '0.35rem 0.6rem', fontSize: '0.85rem'}}>Log out</button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default PersonnelSidebar;