import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Navbar } from './Navbar.js';
import { Sidebar } from './Sidebar.js';

interface AppLayoutProps {
  requiredRole?: 'citizen' | 'admin' | 'worker';
}

export const AppLayout: React.FC<AppLayoutProps> = ({ requiredRole }) => {
  const { user, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-warm flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-forest-200 border-t-forest-800 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-charcoal-600">Loading EcoTrack Portal...</p>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    // Admin has fallback access; workers/citizens restricted
    return <Navigate to={user.role === 'worker' ? '/worker' : '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-surface-warm flex flex-col lg:flex-row antialiased text-charcoal-900">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
