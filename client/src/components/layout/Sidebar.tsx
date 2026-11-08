import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  MapPin,
  Bell,
  User,
  Users,
  Copy,
  BarChart3,
  History,
  Settings,
  HardHat,
  CheckCircle,
  X,
  Compass,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user } = useAuth();

  const citizenNav = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Report Waste', to: '/report', icon: PlusCircle, highlight: true },
    { label: 'My Complaints', to: '/my-complaints', icon: FileText },
    { label: 'Nearby Reports', to: '/nearby', icon: Compass },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const adminNav = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'All Complaints', to: '/admin/complaints', icon: FileText },
    { label: 'Map View', to: '/admin/map', icon: MapPin },
    { label: 'Workers', to: '/admin/workers', icon: Users },
    { label: 'Duplicate Detection', to: '/admin/duplicates', icon: Copy },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
    { label: 'Activity Log', to: '/admin/activity', icon: History },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ];

  const workerNav = [
    { label: 'Overview', to: '/worker', icon: LayoutDashboard },
    { label: 'Assigned Tasks', to: '/worker/tasks', icon: HardHat, highlight: true },
    { label: 'Completion History', to: '/worker/history', icon: CheckCircle },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  let currentNav = citizenNav;
  if (user?.role === 'admin') currentNav = adminNav;
  if (user?.role === 'worker') currentNav = workerNav;

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-charcoal-200">
      {/* Brand Logo Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-charcoal-200">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-forest-900">
          <div className="w-8 h-8 rounded-xl bg-forest-800 text-white flex items-center justify-center text-base shadow-sm">
            🌿
          </div>
          <div>
            <div className="leading-tight font-extrabold tracking-tight text-forest-950 text-base">
              EcoTrack
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">
              Clean & Green
            </div>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-charcoal-500 hover:bg-charcoal-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
          {user?.role === 'admin'
            ? 'Municipal Admin'
            : user?.role === 'worker'
            ? 'Sanitation Crew'
            : 'Citizen Portal'}
        </div>

        {currentNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/admin' || item.to === '/worker'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-smooth ${
                  isActive
                    ? 'bg-forest-800 text-white shadow-soft-sm'
                    : item.highlight
                    ? 'bg-forest-50 text-forest-800 hover:bg-forest-100/80 font-bold'
                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer info badge */}
      <div className="p-4 border-t border-charcoal-200 bg-surface-warm">
        <div className="p-3 bg-white rounded-xl border border-charcoal-200/80 shadow-soft-sm">
          <div className="text-[11px] font-semibold text-charcoal-900">SIH 2025 Inspiration</div>
          <p className="text-[10px] text-charcoal-500 mt-0.5">
            Problem Statement SIH25060 · Smart Waste Management Portal
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-charcoal-950/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
