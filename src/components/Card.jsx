import React from 'react';
import './Card.css';

export default function Card({ title, children, className = '', headerIcon = null, footer = null }) {
  return (
    <div className={`card ${className}`.trim()}>
      <div className="card-header">
        {headerIcon && <div className="icon">{headerIcon}</div>}
        {title && <h3>{title}</h3>}
      </div>
      <div className="card-content">
        {children}
      </div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
