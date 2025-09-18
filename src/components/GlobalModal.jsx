import React from 'react';
import './GlobalModal.css';

export default function GlobalModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="gm-overlay" role="dialog" aria-modal="true">
      <div className="gm-dialog">
        <header className="gm-header">
          <h3>{title}</h3>
          <button className="gm-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="gm-body">{children}</div>
      </div>
    </div>
  );
}
