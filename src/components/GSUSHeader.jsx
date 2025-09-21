import React, { useEffect, useState } from 'react';
import { useSidebar } from '../contexts/SidebarContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './GSUSHeader.css';
import bannerSrc from '../assets/GSUSBanner.svg';
import { listenToUsers } from '../services/firestoreService';

export default function GSUSHeader() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { toggle, toggleCompact, open, compact } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [personnelCount, setPersonnelCount] = useState(null);

  useEffect(() => {
    const unsub = listenToUsers((data, err) => {
      if (err) { setPersonnelCount(null); return; }
      setPersonnelCount(Array.isArray(data) ? data.length : 0);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  // detect mobile to show header hamburger only on narrow screens
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 900 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header className="gsus-header">
      {/* Banner image visible at the top of the header */}
      <div className="gsus-banner">
        <div className="gsus-banner-inner">
          <img src={bannerSrc} alt="GSUS banner" className="gsus-banner-img" />
        </div>

        {/* Bottom-right actionable cluster inside the banner */}
        <div className="gsus-right-bottom">
          {/* On Analytics page, show Print Feedback button instead of personnel info */}
          {location && location.pathname && location.pathname.startsWith('/analytics') ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>Print Feedback</button>
            </div>
          ) : /* hide personnel on dashboard, root, and requests */
            !(location && location.pathname && (location.pathname === '/' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/requests'))) ? (
            <>
              <div className="header-personnel">
                <div className="personnel-label">Personnel</div>
                <div className="personnel-count">{personnelCount === null ? '...' : personnelCount}</div>
                {/* Hide Add Personnel on the All Requests page (/requests) */}
                {!(location && location.pathname && location.pathname.startsWith('/requests')) && (
                  <button className="btn btn-primary" onClick={() => navigate('/personnel')}>Add Personnel</button>
                )}
              </div>
              <div className="gsus-actions-slot" />
            </>
            ) : null}
        </div>
      </div>

      {/* Full-width overlay bar across the banner: left = section title. Right/top controls are separated and absolute. */}
      <div className="gsus-header-bar">
        <div className="gsus-section-left">
          {/* Hamburger toggle for sidebar off-canvas - visible only on mobile */}
          {isMobile && (
            <button className="sidebar-toggle" aria-label="Toggle sidebar" onClick={() => toggle()} aria-pressed={compact || open} aria-expanded={open}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Top-right datetime pill pinned to the top-right of the header */}
      <div className="gsus-right-top">
        <div className="datetime-pill" aria-live="polite">{now.toLocaleString()}</div>
      </div>
    </header>
  );
}
