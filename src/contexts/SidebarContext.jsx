import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  // open: entirely visible (overlay on small screens)
  // compact: narrow icon-only sidebar on desktop
  // initialize state depending on viewport: on desktop we want the sidebar expanded by default
  const STORAGE_KEY = 'gsus:sidebar';
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth > 900 : true;

  // read stored preference if available
  let stored = null;
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    }
  } catch (e) {
    // ignore storage errors
  }

  // default states based on viewport, but prefer stored values when present
  const [open, setOpen] = useState(stored && typeof stored.open === 'boolean' ? stored.open : isDesktop);
  const [compact, setCompact] = useState(stored && typeof stored.compact === 'boolean' ? stored.compact : !isDesktop);

  // reflect state on documentElement for CSS selectors
  useEffect(() => {
    const el = document.documentElement;
    // ensure classes reflect initial state immediately
    if (open) el.classList.add('sidebar-open'); else el.classList.remove('sidebar-open');
    if (compact) el.classList.add('sidebar-compact'); else el.classList.remove('sidebar-compact');

    // persist preference to localStorage whenever changed
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, compact }));
      }
    } catch (e) {
      // ignore storage errors
    }

    // listen for viewport resizes and adjust defaults only when there's no stored preference
    const hasStored = stored !== null;
    const onResize = () => {
      const desktop = window.innerWidth > 900;
      if (!hasStored) {
        // apply reasonable defaults when user has no saved preference
        if (desktop) {
          setOpen(true);
          setCompact(false);
        } else {
          setOpen(false);
          setCompact(true);
        }
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      el.classList.remove('sidebar-open');
      el.classList.remove('sidebar-compact');
      window.removeEventListener('resize', onResize);
    };
  }, [open, compact]);

  const toggle = useCallback(() => setOpen(v => !v), []);
  const close = useCallback(() => setOpen(false), []);
  const openSidebar = useCallback(() => setOpen(true), []);
  const toggleCompact = useCallback(() => setCompact(v => !v), []);
  const setCompactState = useCallback((value) => setCompact(Boolean(value)), []);

  return (
    <SidebarContext.Provider value={{ open, compact, toggle, toggleCompact, close, openSidebar, setCompact: setCompactState }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
};

export default SidebarContext;
