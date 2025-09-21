import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiFileText, FiCalendar, FiUsers, FiBarChart2, FiSettings, FiMessageSquare } from 'react-icons/fi';
import './Sidebar.css';
import { useAuth } from '../hooks/useAuth';
import { listenToUsers } from '../services/firestoreService';
import { listenToConversation } from '../services/firestoreService';
import { useSidebar } from '../contexts/SidebarContext';
import Offcanvas from 'react-bootstrap/Offcanvas';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'GH';
  const displayName = user?.name || 'GSO Head';
  const displayRole = user?.role === 'personnel' ? 'Team Member' : 'Administrator';

  const sidebarRef = useRef(null);
  // use the SidebarContext provided by SidebarProvider in main.jsx
  const { open, close, toggle, openSidebar, compact, toggleCompact } = useSidebar();
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

  // keep a responsive hint: if window is small, treat as compact by default
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 900 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Note: real hook wiring to SidebarContext is applied below inside the component body
  // We'll use a proper hook call to read context and react to changes.

  // Replace direct document class manipulation with context; also add Escape key handling and focus management
  const content = (
    <div>
      {/* Always-visible compact toggle inside the sidebar header so users can toggle when compact */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem' }}>
        <button className="sidebar-toggle internal" aria-label={open ? 'Close sidebar' : 'Open sidebar'} onClick={() => { if (isMobile) { close(); } else { toggleCompact(); const sb = document.querySelector('.sidebar'); if (sb) sb.classList.toggle('compact'); document.documentElement.classList.toggle('sidebar-compact'); } }} aria-expanded={open || compact}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="logo-text">GSUS</h1>
      </div>
      <nav className="sidebar-nav" aria-hidden={open === false && compact === true}>
        <NavLink to="/dashboard" className="nav-item"><FiGrid /><span className="nav-label" aria-hidden={compact}>{'Dashboard'}</span></NavLink>
        <NavLink to="/requests" className="nav-item"><FiFileText /><span className="nav-label" aria-hidden={compact}>{'All Requests'}</span></NavLink>
        <NavLink to="/calendar" className="nav-item"><FiCalendar /><span className="nav-label" aria-hidden={compact}>{'Master Calendar'}</span></NavLink>
        <NavLink to="/chat" className="nav-item"><FiMessageSquare /><span className="nav-label" aria-hidden={compact}>{'Chat'}</span> {unreadCount > 0 && (<span className="unread-badge">{unreadCount}</span>)}</NavLink>
        <NavLink to="/personnel" className="nav-item"><FiUsers /><span className="nav-label" aria-hidden={compact}>{'Personnel'}</span></NavLink>
        <NavLink to="/analytics" className="nav-item"><FiBarChart2 /><span className="nav-label" aria-hidden={compact}>{'Analytics'}</span></NavLink>
        <NavLink to="/settings" className="nav-item"><FiSettings /><span className="nav-label" aria-hidden={compact}>{'Settings'}</span></NavLink>
      </nav>
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
    </div>
  );

  // Render Offcanvas on mobile; persistent sidebar on wide screens
  if (isMobile) {
    return (
      <>
        <Offcanvas show={open} onHide={close} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>GSUS</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {content}
          </Offcanvas.Body>
        </Offcanvas>
      </>
    );
  }

  return (
    <aside ref={sidebarRef} className={`sidebar ${compact ? 'compact' : ''} ${open ? 'open' : ''}`} aria-hidden={false} tabIndex={-1} role="navigation" aria-expanded={compact}>
      {content}
    </aside>
  );
};
export default Sidebar;