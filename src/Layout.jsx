import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import GSODashboard from './pages/GSODashboard';
import AllRequestsPage from './pages/AllRequestsPage';
import MasterCalendarPage from './pages/MasterCalendarPage';
import PersonnelPage from './pages/PersonnelPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import GSUSHeader from './components/GSUSHeader'; // <-- new import
import DivisionsPage from './pages/DivisionsPage';
import DivisionDetail from './pages/DivisionDetail';

// This component is now safely inside the Router, so useLocation will work.
export default function Layout() {
  const location = useLocation();
  const noSidebarRoutes = ['/'];

  return (
    <> {/* Use a React Fragment to avoid extra divs */}
      <GSUSHeader /> {/* sticky header */}
      {!noSidebarRoutes.includes(location.pathname) && <Sidebar />}
      <main className="content-wrapper">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<GSODashboard />} />
          <Route path="/requests" element={<AllRequestsPage />} />
          <Route path="/calendar" element={<MasterCalendarPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/divisions" element={<DivisionsPage />} />
          <Route path="/divisions/:id" element={<DivisionDetail />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </>
  );
}