import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './SectionHeader.css';

export default function SectionHeader({ title, subtitle, actions = null, center = null }) {
  const sentinelRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    // compute header height safely
    let headerHeight = 300;
    try {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) headerHeight = parsed;
    } catch (e) { }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => setActive(!entry.isIntersecting));
    }, { root: null, threshold: 0, rootMargin: `-${headerHeight}px 0px 0px 0px` });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  // If the global header actions/title container exists, portal the actions and title there so buttons/dateline sit in the header area.
  const headerActionsContainer = (typeof document !== 'undefined') ? document.querySelector('.gsus-actions-slot') : null;
  const headerTitleContainer = (typeof document !== 'undefined') ? document.querySelector('.gsus-section-left') : null;

  const actionsNode = actions ? (
    <div className="section-header-actions">{actions}</div>
  ) : null;

  const titleNode = (
    <div className="section-header-title-portal">
      <h1 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-dark)', fontWeight: 700 }}>{title}</h1>
      {subtitle ? <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{subtitle}</div> : null}
    </div>
  );

  // If headerTitleContainer exists, this page has a banner/header and we should portal title & actions there and NOT render the sticky section header.
  if (headerTitleContainer) {
    return (
      <>
        {headerTitleContainer ? createPortal(titleNode, headerTitleContainer) : null}
        {headerActionsContainer && actionsNode ? createPortal(actionsNode, headerActionsContainer) : null}
        <div ref={sentinelRef} style={{ height: '1px', width: '100%' }} />
      </>
    );
  }

  // Fallback: render the section header inline (no banner present)
  return (
    <>
      <div className={`section-header ${active ? 'section-header--active' : ''}`} aria-hidden="false">
        <div className="section-header-left">
          <div className="section-header-title">
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-dark)', fontWeight: 700 }}>{title}</h1>
            {subtitle ? <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{subtitle}</div> : null}
          </div>
        </div>

        <div className="section-header-center">
          {center}
        </div>

        <div className="section-header-spacer" />

        <div className="section-header-right">{actionsNode}</div>
      </div>
      <div ref={sentinelRef} style={{ height: '1px', width: '100%' }} />
    </>
  );
}
