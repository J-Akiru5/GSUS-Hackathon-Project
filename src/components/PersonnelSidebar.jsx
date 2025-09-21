// src/components/PersonnelSidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiFileText, FiCalendar, FiUser } from 'react-icons/fi';
import './Sidebar.css'; // We can reuse the same styles
import { useAuth } from '../hooks/useAuth'; // <-- added
import { useSidebar } from '../contexts/SidebarContext';

const PersonnelSidebar = () => {
    const { user, logout } = useAuth();
    const { open, close, toggleCompact } = useSidebar();
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'PT';
    const displayName = user?.name || 'Personnel';
    const displayRole = user?.role === 'personnel' ? 'Team Member' : (user?.role || 'Personnel');

    return (
        <>
            <aside className={`sidebar ${open ? 'open' : 'hidden'}`} aria-expanded={open} aria-hidden={!open}>
            <div>
                <div className="sidebar-header">
                        <h1 className="logo-text">GSUS</h1>
                </div>
                    <nav className="sidebar-nav">
                        <NavLink to="/my-tasks" className="nav-item"><FiFileText /><span className="nav-label">My Tasks</span></NavLink>
                        <NavLink to="/my-schedule" className="nav-item"><FiCalendar /><span className="nav-label">My Schedule</span></NavLink>
                        <NavLink to="/profile" className="nav-item"><FiUser /><span className="nav-label">Profile</span></NavLink>
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
            {/* overlay for mobile when sidebar is open */}
            {open && <div className="sidebar-overlay" onClick={close} />}
        </>
    );
};

export default PersonnelSidebar;