import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './GSUSHeader.css';
import bannerSrc from '../assets/GSUSBanner.svg';
import { listenToUsers, listenToDivisions, listenToRequests, listenToBookings, listenToFeedback } from '../services/firestoreService';
import { useTranslation } from 'react-i18next';

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
  const [requestsCount, setRequestsCount] = useState(null);
  const [bookingsCount, setBookingsCount] = useState(null);
  const [feedbackCount, setFeedbackCount] = useState(null);
  const [lastActivityAt, setLastActivityAt] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const unsubP = listenToUsers((data, err) => {
      if (err) { setPersonnelCount(null); return; }
      setPersonnelCount(Array.isArray(data) ? data.length : 0);
    });
    const unsubD = listenToDivisions((data, err) => {
      if (err) { setDivisionsCount(null); return; }
      setDivisionsCount(Array.isArray(data) ? data.length : 0);
    });
    // helper to extract latest timestamp from an array of documents
    const getLatestTimestamp = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return null;
      let latest = 0;
      for (const d of arr) {
        // check multiple possible timestamp fields
        const candidates = [d.submittedAt, d.createdAt, d.updatedAt, d.dateSubmitted, d.timestamp, d.submitted_at];
        for (const c of candidates) {
          if (c == null) continue;
          try {
            let t = c;
            if (typeof t === 'object' && typeof t.toDate === 'function') t = t.toDate();
            const ms = (t instanceof Date) ? t.getTime() : Number(new Date(t).getTime());
            if (!Number.isNaN(ms) && ms > latest) latest = ms;
          } catch (e) { void e; }
        }
      }
      return latest > 0 ? new Date(latest) : null;
    };

    const unsubR = listenToRequests((data, err) => {
      if (err) { setRequestsCount(null); return; }
      setRequestsCount(Array.isArray(data) ? data.length : 0);
      const t = getLatestTimestamp(data);
      if (t) setLastActivityAt(prev => (prev && prev.getTime() >= t.getTime()) ? prev : t);
    });

    const unsubB = listenToBookings((data, err) => {
      if (err) { setBookingsCount(null); return; }
      setBookingsCount(Array.isArray(data) ? data.length : 0);
      const t = getLatestTimestamp(data);
      if (t) setLastActivityAt(prev => (prev && prev.getTime() >= t.getTime()) ? prev : t);
    });
    const unsubF = listenToFeedback((data, err) => {
      if (err) { setFeedbackCount(null); return; }
      setFeedbackCount(Array.isArray(data) ? data.length : 0);
    });
    return () => {
      if (typeof unsubP === 'function') unsubP();
      if (typeof unsubD === 'function') unsubD();
      if (typeof unsubR === 'function') unsubR();
      if (typeof unsubB === 'function') unsubB();
      if (typeof unsubF === 'function') unsubF();
    };
  }, []);

  // simple responsive detection so we can move actions off the banner onto the mobile heading
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setIsMobile(false);
      return;
    }
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mq.matches);
    // initialize
    onChange();
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // determine whether to show header actions (when banner is hidden or on certain pages)
  const showHeaderActions = !(location && location.pathname && (location.pathname === '/' || location.pathname.startsWith('/dashboard'))) && (
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

        {/* Bottom-right actionable cluster inside the banner - only show on desktop/tablet; mobile shows actions on mobile heading */}
        {!hideBannerActions && !isMobile && (
          <div className="gsus-right-bottom">
            {location && location.pathname && location.pathname.startsWith('/divisions') && (
              <div className="header-personnel">
                <div className="personnel-label">{t('Divisions')}</div>
                <div className="personnel-count">{divisionsCount === null ? '...' : divisionsCount}</div>
                {!(location && location.pathname && location.pathname.startsWith('/requests')) && (
                  <button className="btn btn-primary" onClick={() => navigate('/divisions')}>{t('Add Division')}</button>
                )}
              </div>
            )}
            {location && location.pathname && location.pathname.startsWith('/personnel') && (
              <div className="header-personnel">
                <div className="personnel-label">{t('Personnel')}</div>
                <div className="personnel-count">{personnelCount === null ? '...' : personnelCount}</div>
                {!(location && location.pathname && location.pathname.startsWith('/requests')) && (
                  <button className="btn btn-primary" onClick={() => navigate('/personnel')}>{t('Add Personnel')}</button>
                )}
              </div>
            )}
            <div className="gsus-actions-slot" />
          </div>
        )}
        {/* If on analytics page show last-updated on the banner */}
        {path.startsWith('/analytics') && (
          <div className="banner-last-updated">{t('Last updated')}: {lastActivityAt ? lastActivityAt.toLocaleString() : '—'}</div>
        )}
      </div>

      {/* Mobile compact page heading: replaces banner on small viewports */}
      <div className="mobile-page-heading" role="region" aria-label="Page heading">
        <div className="mobile-heading-left">
          <h2 className="mobile-page-title">{t(pageTitle)}</h2>
          {pageSubtitle && <div className="mobile-page-subtitle">{t(pageSubtitle)}</div>}
        </div>
        <div className="mobile-heading-actions">
          {/* On mobile, render the small label/count + action buttons inside the mobile heading */}
          {!hideBannerActions && isMobile && (
            <>
              {path.startsWith('/divisions') && (
                <div className="mobile-action-block">
                  <div className="mobile-action-label">{t('Divisions')}</div>
                  <div className="mobile-action-count">{divisionsCount === null ? '...' : divisionsCount}</div>
                  {!(location && location.pathname && location.pathname.startsWith('/requests')) && (
                    <button className="btn btn-primary" onClick={() => navigate('/divisions')}>{t('Add Division')}</button>
                  )}
                </div>
              )}
              {path.startsWith('/personnel') && (
                <div className="mobile-action-block">
                  <div className="mobile-action-label">Personnel</div>
                  <div className="mobile-action-count">{personnelCount === null ? '...' : personnelCount}</div>
                  {!(location && location.pathname && location.pathname.startsWith('/requests')) && (
                    <button className="btn btn-primary" onClick={() => navigate('/personnel')}>Add Personnel</button>
                  )}
                </div>
              )}
              {path.startsWith('/requests') && (
                <div className="mobile-action-block">
                  <div className="mobile-action-label">{requestsCount === null ? '...' : `${requestsCount} ${t('requests')}`}</div>
                  <button className="mobile-action-btn btn btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('gsus:open-add-request'))}>Add Request</button>
                </div>
              )}
              {path.startsWith('/calendar') && (
                <div className="mobile-action-block">
                  <div className="mobile-action-label">{bookingsCount === null ? '...' : `${bookingsCount} ${t('bookings')}`}</div>
                  <button className="mobile-action-btn btn btn-primary" onClick={() => window.dispatchEvent(new CustomEvent('gsus:open-add-booking'))}>Add Booking</button>
                </div>
              )}
              {path.startsWith('/analytics') && (
                <div className="mobile-action-block">
                  <div className="mobile-action-label">{feedbackCount === null ? '...' : `${feedbackCount} ${t('feedback')}`}</div>
                  <button className="mobile-action-btn btn btn-primary" onClick={() => window.print()}>{t('Print Feedback')}</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Full-width overlay bar across the banner: left = section title. Right/top controls are separated and absolute. */}
      <div className="gsus-header-bar">
        <div className="gsus-section-left" />
        {/* Right-side: render actionable controls so they're visible even when the banner is hidden */}
        <div className="gsus-section-right">
          {/* Show Divisions controls in header when banner is hidden or on specific pages */}
          {showHeaderActions && (
            <>
              {location && location.pathname && location.pathname.startsWith('/divisions') && (
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
