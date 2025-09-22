import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiFileText, FiCalendar, FiUsers, FiBarChart2, FiSettings, FiMessageSquare } from 'react-icons/fi';
import './Sidebar.css';
import { useAuth } from '../hooks/useAuth';
import { listenToUsers } from '../services/firestoreService';
import { listenToConversation } from '../services/firestoreService';
import { useSidebar } from '../contexts/SidebarContext';
import Offcanvas from 'react-bootstrap/Offcanvas';

// Small local component: hamburger that toggles compact on desktop and toggles offcanvas on mobile
const SidebarToggle = () => {
  const { toggle, toggleCompact, isDesktop } = useSidebar();
  return (
    <button
      className="sidebar-toggle"
      aria-label="Toggle sidebar"
      onClick={() => { if (isDesktop) toggleCompact(); else toggle(); }}
      title="Toggle sidebar"
    >
      <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect width="20" height="2" y="0" rx="1" fill="currentColor" />
        <rect width="20" height="2" y="6" rx="1" fill="currentColor" />
        <rect width="20" height="2" y="12" rx="1" fill="currentColor" />
      </svg>
    </button>
  );
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'GH';
  const displayName = user?.name || 'GSO Head';
  const displayRole = user?.role === 'personnel' ? 'Team Member' : 'Administrator';

  const sidebarRef = useRef(null);
  // use the SidebarContext provided by SidebarProvider in main.jsx
  const { open, close, toggle, openSidebar, compact, isDesktop } = useSidebar();
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

  // compact state is provided by SidebarContext (and persisted to localStorage)

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
      {/* Desktop/large screens: render existing aside */}
      {isDesktop ? (
        <>
          {open && <div className="sidebar-overlay" onClick={() => close()} aria-hidden="true" />}
          <aside ref={sidebarRef} className={`sidebar ${compact ? 'compact' : ''} ${open ? 'open' : ''}`} aria-hidden={!open && compact} tabIndex={-1} role="dialog" aria-modal={open}>
            <div>
              <button className="sidebar-close-btn" aria-label="Close sidebar" onClick={() => close()} style={{ display: compact ? 'block' : 'none' }}>✕</button>
              <div className="sidebar-header">
                <SidebarToggle />
                <h1 className="logo-text">GSUS</h1>
              </div>
              <nav className="sidebar-nav">
                <NavLink to="/dashboard" className="nav-item" title="Dashboard"><FiGrid className="nav-icon" /><span className="nav-label">Dashboard</span></NavLink>
                <NavLink to="/requests" className="nav-item" title="All Requests"><FiFileText className="nav-icon" /><span className="nav-label">All Requests</span></NavLink>
                <NavLink to="/calendar" className="nav-item" title="Master Calendar"><FiCalendar className="nav-icon" /><span className="nav-label">Master Calendar</span></NavLink>
                <NavLink to="/divisions" className="nav-item" title="Divisions"><FiUsers className="nav-icon" /><span className="nav-label">Divisions</span></NavLink>
                <NavLink to="/chat" className="nav-item" title="Chat"><FiMessageSquare className="nav-icon" /> <span className="nav-label">Chat {unreadCount > 0 && (<span className="unread-badge">{unreadCount}</span>)}</span></NavLink>
                <NavLink to="/personnel" className="nav-item" title="Personnel"><FiUsers className="nav-icon" /><span className="nav-label">Personnel</span></NavLink>
                <NavLink to="/analytics" className="nav-item" title="Analytics"><FiBarChart2 className="nav-icon" /><span className="nav-label">Analytics</span></NavLink>
                <NavLink to="/settings" className="nav-item" title="Settings"><FiSettings className="nav-icon" /><span className="nav-label">Settings</span></NavLink>
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
      ) : (
        /* Mobile: use react-bootstrap Offcanvas to provide accessible offcanvas behavior */
        <Offcanvas show={open} onHide={() => close()} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>GSUS</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <nav className="sidebar-nav offcanvas-nav">
              <NavLink to="/dashboard" className="nav-item" title="Dashboard" onClick={() => close()}><FiGrid className="nav-icon" /><span className="nav-label">Dashboard</span></NavLink>
              <NavLink to="/requests" className="nav-item" title="All Requests" onClick={() => close()}><FiFileText className="nav-icon" /><span className="nav-label">All Requests</span></NavLink>
              <NavLink to="/calendar" className="nav-item" title="Master Calendar" onClick={() => close()}><FiCalendar className="nav-icon" /><span className="nav-label">Master Calendar</span></NavLink>
              <NavLink to="/divisions" className="nav-item" title="Divisions" onClick={() => close()}><FiUsers className="nav-icon" /><span className="nav-label">Divisions</span></NavLink>
              <NavLink to="/chat" className="nav-item" title="Chat" onClick={() => close()}><FiMessageSquare className="nav-icon" /> <span className="nav-label">Chat {unreadCount > 0 && (<span className="unread-badge">{unreadCount}</span>)}</span></NavLink>
              <NavLink to="/personnel" className="nav-item" title="Personnel" onClick={() => close()}><FiUsers className="nav-icon" /><span className="nav-label">Personnel</span></NavLink>
              <NavLink to="/analytics" className="nav-item" title="Analytics" onClick={() => close()}><FiBarChart2 className="nav-icon" /><span className="nav-label">Analytics</span></NavLink>
              <NavLink to="/settings" className="nav-item" title="Settings" onClick={() => close()}><FiSettings className="nav-icon" /><span className="nav-label">Settings</span></NavLink>
            </nav>
            <div style={{ marginTop: 12 }}>
              <div className="user-profile offcanvas-user">
                <div className="user-avatar">{initials}</div>
                <div className="user-info"><div className="user-name">{displayName}</div><div className="user-role">{displayRole}</div></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { logout(); close(); }}>Log out</button>
              </div>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
      )}
    </>
  );
};
export default Sidebar;