import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './GSUSHeader.css';
import bannerSrc from '../assets/GSUSBanner.svg';
import { listenToUsers, listenToDivisions } from '../services/firestoreService';

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

  return (
    <header className="gsus-header">
      {/* Banner image visible at the top of the header */}
      <div className="gsus-banner">
        <div className="gsus-banner-inner">
          <img src={bannerSrc} alt="GSUS banner" className="gsus-banner-img" />
        </div>

        {/* Bottom-right actionable cluster inside the banner */}
        <div className="gsus-right-bottom">
          {/* Hide the personnel block on dashboard pages */}
          {!(location && location.pathname && (location.pathname === '/' || location.pathname.startsWith('/dashboard'))) && (
            <>
              {/* Show Divisions block when on /divisions, otherwise show Personnel block */}
              {location && location.pathname && location.pathname.startsWith('/divisions') ? (
                <div className="header-personnel">
                  <div className="personnel-label">Divisions</div>
                  <div className="personnel-count">{divisionsCount === null ? '...' : divisionsCount}</div>
                  {/* Button removed: SectionHeader will portal the Add Division action into the banner */}
                </div>
              ) : (
                <div className="header-personnel">
                  <div className="personnel-label">Personnel</div>
                  <div className="personnel-count">{personnelCount === null ? '...' : personnelCount}</div>
                  {/* Hide Add Personnel on the All Requests page (/requests) */}
                  {!(location && location.pathname && location.pathname.startsWith('/requests')) && (
                    <button className="btn btn-primary" onClick={() => navigate('/personnel')}>Add Personnel</button>
                  )}
                </div>
              )}
              <div className="gsus-actions-slot" />
            </>
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
                    {/* Button removed: SectionHeader will portal the Add Division action into the header */}
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
