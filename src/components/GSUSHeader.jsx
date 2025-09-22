import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './GSUSHeader.css';
import bannerSrc from '../assets/GSUSBanner.svg';
import { listenToUsers, listenToDivisions } from '../services/firestoreService';

// Small mobile-only button to toggle the offcanvas sidebar
function MobileSidebarButton() {
  const { toggle, isDesktop } = useSidebar();
  if (isDesktop) return null; // only show on mobile
  return (
    <button className="mobile-sidebar-btn" onClick={() => toggle()} aria-label="Open menu" title="Open menu">
      <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect width="22" height="2" y="0" rx="1" fill="currentColor" />
        <rect width="22" height="2" y="7" rx="1" fill="currentColor" />
        <rect width="22" height="2" y="14" rx="1" fill="currentColor" />
      </svg>
    </button>
  );
}

export default function GSUSHeader() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Header no longer controls sidebar toggle; the control lives in the sidebar itself
  const navigate = useNavigate();
  const location = useLocation();
  const [personnelCount, setPersonnelCount] = useState(null);
  const [divisionsCount, setDivisionsCount] = useState(null);

  useEffect(() => {
    const unsub = listenToUsers((data, err) => {
      if (err) { setPersonnelCount(null); return; }
      setPersonnelCount(Array.isArray(data) ? data.length : 0);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  useEffect(() => {
    const unsub = listenToDivisions((data, err) => {
      if (err) { setDivisionsCount(null); return; }
      setDivisionsCount(Array.isArray(data) ? data.length : 0);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  // determine whether to show the personnel block in the header (even when banner is hidden)
  const showHeaderPersonnel = !(location && location.pathname && (location.pathname === '/' || location.pathname.startsWith('/dashboard'))) && (
    (typeof document !== 'undefined' && document.body.classList.contains('hide-banner')) || ['/calendar', '/chat', '/settings'].includes(location.pathname)
  );

  // compute a compact page title and optional subtitle for mobile heading
  const routeTitleMap = {
    '/': ['Home', ''],
    '/dashboard': ['Dashboard', 'Overview & stats'],
    '/requests': ['All Requests', 'View and manage requests'],
    '/calendar': ['Master Calendar', 'Unified bookings & requests'],
    '/divisions': ['Divisions', 'Manage organizational divisions'],
    '/personnel': ['Personnel', 'Manage staff & roles'],
    '/analytics': ['Analytics', 'Reports & activity'],
    '/chat': ['Chat', 'Conversations']
  };
  const path = location?.pathname || '/';
  const [pageTitle, pageSubtitle] = routeTitleMap[path] || [path.replace('/', '') || 'Page', ''];

  // routes where banner actions should be hidden (configurable)
  const hideBannerActionsOn = ['/calendar', '/settings'];
  const hideBannerActions = hideBannerActionsOn.some(p => path.startsWith(p));

  return (
    <header className="gsus-header">
      {/* Mobile toolbar: sidebar toggle for small viewports */}
      <MobileSidebarButton />
      {/* Banner image visible at the top of the header (hidden on mobile; replaced by compact heading) */}
      <div className="gsus-banner">
        <div className="gsus-banner-inner">
          <img src={bannerSrc} alt="GSUS banner" className="gsus-banner-img" />
        </div>

        {/* Bottom-right actionable cluster inside the banner - show Divisions actions only */}
        {!hideBannerActions && (
          <div className="gsus-right-bottom">
            {location && location.pathname && location.pathname.startsWith('/divisions') && (
              <div className="header-personnel">
                <div className="personnel-label">Divisions</div>
                <div className="personnel-count">{divisionsCount === null ? '...' : divisionsCount}</div>
                {!(location && location.pathname && location.pathname.startsWith('/requests')) && (
                  <button className="btn btn-primary" onClick={() => navigate('/divisions')}>Add Division</button>
                )}
              </div>
            )}
            <div className="gsus-actions-slot" />
          </div>
        )}
      </div>

      {/* Mobile compact page heading: replaces banner on small viewports */}
      <div className="mobile-page-heading" role="region" aria-label="Page heading">
        <div className="mobile-heading-left">
          <h2 className="mobile-page-title">{pageTitle}</h2>
          {pageSubtitle && <div className="mobile-page-subtitle">{pageSubtitle}</div>}
        </div>
        <div className="mobile-heading-actions">
          {/* replicate actions: hide on configured routes; on divisions show Add Division only */}
          {!hideBannerActions && path.startsWith('/divisions') && (
            <button className="btn btn-primary" onClick={() => navigate('/divisions')}>Add Division</button>
          )}
        </div>
      </div>

      {/* Full-width overlay bar across the banner: left = section title. Right/top controls are separated and absolute. */}
      <div className="gsus-header-bar">
        <div className="gsus-section-left" />
        {/* Right-side: render actionable controls so they're visible even when the banner is hidden */}
        <div className="gsus-section-right">
          {/* Show personnel/action controls in header when banner is hidden or on specific pages */}
          {showHeaderPersonnel && (
            <>
              {location && location.pathname && location.pathname.startsWith('/divisions') ? (
                <>
                  <div className="header-personnel">
                    <div className="personnel-label">Divisions</div>
                    <div className="personnel-count">{divisionsCount === null ? '...' : divisionsCount}</div>
                    {!(location && location.pathname && location.pathname.startsWith('/requests')) && (
                      <button className="btn btn-primary" onClick={() => navigate('/divisions')}>Add Division</button>
                    )}
                  </div>
                  <div className="gsus-actions-slot" />
                </>
              ) : (
                <>
                  <div className="header-personnel">
                    <div className="personnel-label">Personnel</div>
                    <div className="personnel-count">{personnelCount === null ? '...' : personnelCount}</div>
                    {!(location && location.pathname && location.pathname.startsWith('/requests')) && (
                      <button className="btn btn-primary" onClick={() => navigate('/personnel')}>Add Personnel</button>
                    )}
                  </div>
                  <div className="gsus-actions-slot" />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Top-right datetime pill: rendered into document.body so it's always visible regardless of header/banner state */}
      {typeof document !== 'undefined' && createPortal(
        <div className="datetime-pill" aria-live="polite">{now.toLocaleString()}</div>
      , document.body)}
    </header>
  );
}
