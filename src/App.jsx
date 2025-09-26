// src/App.jsx (FINAL VERSION WITH ROLES)

import React from 'react';
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import AdminSidebar from './components/Sidebar';
import PersonnelSidebar from './components/PersonnelSidebar';
import GSUSHeader from './components/GSUSHeader'; // <-- added

// Pages
import LoginPage from './pages/LoginPage';
import GSODashboard from './pages/GSODashboard';
import AllRequestsPage from './pages/AllRequestsPage';
import MasterCalendarPage from './pages/MasterCalendarPage';
import PersonnelPage from './pages/PersonnelPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import PersonnelDashboard from './pages/PersonnelDashboard'; // Your "My Tasks" page
import ChatPage from './pages/ChatPage';
import DivisionsPage from './pages/DivisionsPage';
import FeedbacksPage from './pages/FeedbacksPage';

// --- Layout Components ---
const HeaderWrapper = ({ children }) => {
  const location = useLocation();
  const hidePaths = ['/calendar', '/chat', '/settings'];
  // detect mobile viewport so we can force header visible on small screens
  const [isMobile, setIsMobile] = React.useState(() => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false));

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = (e) => setIsMobile(e.matches);
    try { mq.addEventListener('change', onChange); } catch { mq.addListener(onChange); }
    return () => { try { mq.removeEventListener('change', onChange); } catch { mq.removeListener(onChange); } };
  }, []);

  // On mobile we always show the header. On web, use the hidePaths logic.
  const hideHeaderOnWeb = hidePaths.some(p => location.pathname.startsWith(p));
  const hideHeader = !isMobile && hideHeaderOnWeb;

  // Only manipulate the body class for web - mobile should always display banner/header
  React.useEffect(() => {
    if (!isMobile && hideHeaderOnWeb) document.body.classList.add('hide-banner');
    else document.body.classList.remove('hide-banner');
    return () => { document.body.classList.remove('hide-banner'); };
  }, [isMobile, hideHeaderOnWeb]);

  return (
    <div>
      {!hideHeader && <GSUSHeader />}
      {children}
    </div>
  );
};

const AdminLayout = () => (
  <HeaderWrapper>
    <div className="main-layout">
      <AdminSidebar />
      <div className="app-container">
        <main className="content-wrapper"><Outlet /></main>
      </div>
    </div>
  </HeaderWrapper>
);

const PersonnelLayout = () => (
  <HeaderWrapper>
    <div className="main-layout">
      <PersonnelSidebar />
      <div className="app-container">
        <main className="content-wrapper"><Outlet /></main>
      </div>
    </div>
  </HeaderWrapper>
);

// --- Protected Route Component ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();
  console.log('ProtectedRoute user:', user);
  if (!user) return <Navigate to="/" />;
  return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/" />;
};


function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<GSODashboard />} />
          <Route path="/requests" element={<AllRequestsPage />} />
          <Route path="/calendar" element={<MasterCalendarPage />} />
          <Route path="/chat" element={<ChatPage />} />
        <Route path="/divisions" element={<DivisionsPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
      <Route path="/feedbacks" element={<FeedbacksPage />} />
      </Route>

      {/* Personnel Routes */}
      <Route element={<PersonnelLayout />}>
        <Route path="/my-tasks" element={<PersonnelDashboard />} />
        {/* Add routes for My Schedule and Profile here if you build them */}
      </Route>
    </Routes>
  );
}

export default App;