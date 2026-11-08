import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';

// Layout & Common
import { AppLayout } from './components/layout/AppLayout.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

// Citizen Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard.js';
import { ReportWastePage } from './pages/citizen/ReportWastePage.js';
import { MyComplaintsPage } from './pages/citizen/MyComplaintsPage.js';
import { ComplaintDetailPage } from './pages/citizen/ComplaintDetailPage.js';
import { EditComplaintPage } from './pages/citizen/EditComplaintPage.js';
import { NearbyReportsPage } from './pages/citizen/NearbyReportsPage.js';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AllComplaintsPage } from './pages/admin/AllComplaintsPage.js';
import { MapViewPage } from './pages/admin/MapViewPage.js';
import { WorkerManagementPage } from './pages/admin/WorkerManagementPage.js';
import { DuplicateDetectionPage } from './pages/admin/DuplicateDetectionPage.js';
import { AnalyticsPage } from './pages/admin/AnalyticsPage.js';
import { ActivityLogPage } from './pages/admin/ActivityLogPage.js';
import { SettingsPage } from './pages/admin/SettingsPage.js';

// Worker Pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard.js';
import { AssignedTasksPage } from './pages/worker/AssignedTasksPage.js';
import { WorkerTaskDetailPage } from './pages/worker/WorkerTaskDetailPage.js';
import { CompletionHistoryPage } from './pages/worker/CompletionHistoryPage.js';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated Citizen / General Portal Routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<CitizenDashboard />} />
        <Route path="/report" element={<ReportWastePage />} />
        <Route path="/my-complaints" element={<MyComplaintsPage />} />
        <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
        <Route path="/complaints/:id/edit" element={<EditComplaintPage />} />
        <Route path="/nearby" element={<NearbyReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Municipal Administrator Protected Routes */}
      <Route element={<AppLayout requiredRole="admin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/complaints" element={<AllComplaintsPage />} />
        <Route path="/admin/map" element={<MapViewPage />} />
        <Route path="/admin/workers" element={<WorkerManagementPage />} />
        <Route path="/admin/duplicates" element={<DuplicateDetectionPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/activity" element={<ActivityLogPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      {/* Sanitation Worker Protected Routes */}
      <Route element={<AppLayout requiredRole="worker" />}>
        <Route path="/worker" element={<WorkerDashboard />} />
        <Route path="/worker/tasks" element={<AssignedTasksPage />} />
        <Route path="/worker/tasks/:id" element={<WorkerTaskDetailPage />} />
        <Route path="/worker/history" element={<CompletionHistoryPage />} />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
