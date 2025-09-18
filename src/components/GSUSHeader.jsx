import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './GSUSHeader.css';
import bannerSrc from '../assets/GSUS_Header.svg';

export default function GSUSHeader() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="gsus-header">
      {/* Banner image always visible at the top of the header */}
      <div className="gsus-banner">
        <div className="gsus-banner-inner">
          <img src={bannerSrc} alt="GSUS banner" className="gsus-banner-img" />
        </div>
      </div>

      <div className="gsus-header-inner">
        <div className="gsus-header-actions">
          <div className="datetime-pill" aria-live="polite">{now.toLocaleString()}</div>
        </div>
      </div>
    </header>
  );
}
