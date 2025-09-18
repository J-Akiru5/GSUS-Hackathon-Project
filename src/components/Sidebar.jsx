import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiFileText, FiCalendar, FiUsers, FiBarChart2, FiSettings, FiMessageSquare } from 'react-icons/fi';
import './Sidebar.css';
import { useAuth } from '../hooks/useAuth';
import { listenToUsers } from '../services/firestoreService';
import { listenToConversation } from '../services/firestoreService';
import { useSidebar } from '../contexts/SidebarContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'GH';
  const displayName = user?.name || 'GSO Head';
  const displayRole = user?.role === 'personnel' ? 'Team Member' : 'Administrator';

  const sidebarRef = useRef(null);
  const [compact, setCompact] = useState(false);
  // use the SidebarContext provided by SidebarProvider in main.jsx
  const { open, close, toggle, openSidebar } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);

  // monitor unread messages for current user vs GSO Head
  useEffect(() => {
    let unsub = null;
    const usersUnsub = listenToUsers((users) => {
      const gso = users.find(u => (u.role || '').toLowerCase() === 'gso_head');
      const current = user;
      if (gso && current) {
        if (unsub) unsub();
        unsub = listenToConversation(current.id || current.userId || current.uid, gso.id, (msgs) => {
          const unread = msgs.filter(m => m.receiverId === (current.id || current.userId || current.uid) && !m.read).length;
          setUnreadCount(unread);
        });
      }
    });
    return () => {
      if (usersUnsub) usersUnsub();
      if (unsub) unsub();
    };
  }, [user]);

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

  // Note: real hook wiring to SidebarContext is applied below inside the component body
  // We'll use a proper hook call to read context and react to changes.

  // Replace direct document class manipulation with context; also add Escape key handling and focus management
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) {
        try { close(); } catch (err) { /* noop */ }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Manage focus when opening the offcanvas sidebar
  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    if (open) {
      // store previous active element so we can restore
      const prev = document.activeElement;
      el.focus();
      return () => {
        try { prev?.focus?.(); } catch (e) { }
      };
    }
  }, [open]);

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={() => close()} aria-hidden="true" />}
      <aside ref={sidebarRef} className={`sidebar ${compact ? 'compact' : ''} ${open ? 'open' : ''} offcanvas`} aria-hidden={!open && compact} tabIndex={-1} role="dialog" aria-modal={open}>
      <div>
          <button className="sidebar-close-btn" aria-label="Close sidebar" onClick={() => close()} style={{ display: compact ? 'block' : 'none' }}>✕</button>
        <div className="sidebar-header">
          {/* <img src="/src/assets/GSUS_logo.svg" alt="GSUS Logo" className="logo-img"/> */}
          <h1 className="logo-text">GSUS</h1>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="nav-item"><FiGrid /> Dashboard</NavLink>
          <NavLink to="/requests" className="nav-item"><FiFileText /> All Requests</NavLink>
          <NavLink to="/calendar" className="nav-item"><FiCalendar /> Master Calendar</NavLink>
          <NavLink to="/chat" className="nav-item"><FiMessageSquare /> Chat {unreadCount > 0 && (<span className="unread-badge">{unreadCount}</span>)}</NavLink>
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
    </>
  );
};
export default Sidebar;