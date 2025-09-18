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

function App() {
  const location = useLocation();
  const noSidebarRoutes = ['/'];

  return (
    <div className="main-layout">
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
    </div>
  );
}

export default App;