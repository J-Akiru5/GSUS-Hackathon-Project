import React, { useEffect, useRef, useState } from 'react';
import './SectionHeader.css';

export default function SectionHeader({ title, subtitle }) {
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

  return (
    <>
      <div className={`section-header ${active ? 'section-header--active' : ''}`} aria-hidden="false">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-dark)', fontWeight: 700 }}>{title}</h1>
          {subtitle ? <div style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{subtitle}</div> : null}
        </div>
      </div>
      <div ref={sentinelRef} style={{ height: '1px', width: '100%' }} />
    </>
  );
}
