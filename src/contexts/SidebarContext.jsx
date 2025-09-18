import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  // keep a class on documentElement for any legacy CSS that relies on it
  useEffect(() => {
    if (open) document.documentElement.classList.add('sidebar-open'); else document.documentElement.classList.remove('sidebar-open');
    return () => document.documentElement.classList.remove('sidebar-open');
  }, [open]);

  const toggle = useCallback(() => setOpen(v => !v), []);
  const close = useCallback(() => setOpen(false), []);
  const openSidebar = useCallback(() => setOpen(true), []);

  return (
    <SidebarContext.Provider value={{ open, toggle, close, openSidebar }}>
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
