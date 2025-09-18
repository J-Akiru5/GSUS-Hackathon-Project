import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './Popover.css';

// Lightweight popover with focus-trap, ARIA roles, Escape-to-close and click-outside.
// Positioning: prefer below the anchor, but flip to top or shift horizontally if it would go off-screen.
export default function Popover({ anchorRef, open, onClose, children, prefer = 'bottom', offset = 8, role = 'dialog', ariaLabel }) {
  const ref = useRef(null);
  const previouslyFocused = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    // focus the first focusable element in popover or the popover itself
    const el = ref.current;
    if (el) {
      const focusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      (focusable || el).focus();
    }

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (e.key === 'Tab') {
        // simple focus trap
        const focusable = Array.from(el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
          .filter(a => !a.hasAttribute('disabled'));
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      try { previouslyFocused.current && previouslyFocused.current.focus(); } catch (e) {}
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const anchor = anchorRef?.current;
      if (ref.current && !ref.current.contains(e.target) && anchor && !anchor.contains(e.target)) {
        onClose?.();
      }
    };
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('touchstart', onDoc);
    return () => { window.removeEventListener('mousedown', onDoc); window.removeEventListener('touchstart', onDoc); };
  }, [open, onClose, anchorRef]);

  // compute positioning
  useEffect(() => {
    if (!open) return;
    const anchor = anchorRef?.current;
    const el = ref.current;
    if (!anchor || !el) return;
    const aRect = anchor.getBoundingClientRect();
    const pRect = el.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // try preferred placement then flip
    const placements = prefer === 'top' ? ['top','bottom'] : ['bottom','top'];
    let chosen = null;
    let calc = {};
    for (const place of placements) {
      if (place === 'bottom') {
        const top = aRect.bottom + offset;
        let left = aRect.left;
        // shift if going off the right
        if (left + pRect.width > viewportW - 8) left = Math.max(8, viewportW - pRect.width - 8);
        // shift if off left
        if (left < 8) left = 8;
        if (top + pRect.height <= viewportH - 8) { chosen = place; calc = { top: `${top + window.scrollY}px`, left: `${left + window.scrollX}px` }; break; }
      } else {
        const top = aRect.top - pRect.height - offset;
        let left = aRect.left;
        if (left + pRect.width > viewportW - 8) left = Math.max(8, viewportW - pRect.width - 8);
        if (left < 8) left = 8;
        if (top >= 8) { chosen = place; calc = { top: `${top + window.scrollY}px`, left: `${left + window.scrollX}px` }; break; }
      }
    }
    if (!chosen) {
      // fallback center near anchor
      const top = Math.min(viewportH - pRect.height - 8, Math.max(8, aRect.bottom + offset));
      const left = Math.min(viewportW - pRect.width - 8, Math.max(8, aRect.left));
      calc = { top: `${top + window.scrollY}px`, left: `${left + window.scrollX}px` };
    }
    setStyle(calc);
  }, [open, anchorRef, offset, prefer]);

  if (!open) return null;

  // ensure there's a portal root for popovers
  const id = 'app-popover-root';
  let portalRoot = document.getElementById(id);
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = id;
    document.body.appendChild(portalRoot);
  }

  return ReactDOM.createPortal(
    <div className="popover-portal" aria-hidden="false">
      <div
        ref={ref}
        className="popover"
        role={role}
        aria-label={ariaLabel}
        tabIndex={-1}
        style={style}
      >
        {children}
      </div>
    </div>,
    portalRoot
  );
}
