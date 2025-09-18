import React from 'react';
// --- THIS IS THE CRITICAL LINE THAT WAS MISSING ---
import { Routes, Route, useLocation } from 'react-router-dom'; 

import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import GSODashboard from './pages/GSODashboard';
import AllRequestsPage from './pages/AllRequestsPage';
import MasterCalendarPage from './pages/MasterCalendarPage';
import PersonnelPage from './pages/PersonnelPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

// This component is now safely inside the Router, so useLocation will work.
export default function Layout() {
  const location = useLocation();
  const noSidebarRoutes = ['/'];

  return (
    <> {/* Use a React Fragment to avoid extra divs */}
      {!noSidebarRoutes.includes(location.pathname) && <Sidebar />}
      <main className="content-wrapper">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<GSODashboard />} />
          <Route path="/requests" element={<AllRequestsPage />} />
          <Route path="/calendar" element={<MasterCalendarPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </>
  );
}