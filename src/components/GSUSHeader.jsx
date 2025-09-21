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

  const { toggle } = useSidebar();
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
          )}
        </div>
      </div>

      {/* Full-width overlay bar across the banner: left = section title. Right/top controls are separated and absolute. */}
      <div className="gsus-header-bar">
        <div className="gsus-section-left" />
      </div>

      {/* Top-right datetime pill pinned to the top-right of the header */}
      <div className="gsus-right-top">
        <div className="datetime-pill" aria-live="polite">{now.toLocaleString()}</div>
      </div>
    </header>
  );
}
