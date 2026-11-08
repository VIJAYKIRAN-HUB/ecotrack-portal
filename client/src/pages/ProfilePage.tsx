import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { User, Shield, HardHat, Mail, Phone, Calendar, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">User Profile</h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Manage your account credentials and role settings.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft space-y-6">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-charcoal-100">
          <div className="w-16 h-16 rounded-2xl bg-forest-800 text-white font-extrabold text-2xl flex items-center justify-center shadow-soft">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-charcoal-900">{user.name}</h3>
            <div className="mt-1">
              {user.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-100 text-forest-800">
                  <Shield className="w-3.5 h-3.5" />
                  Municipal Administrator
                </span>
              ) : user.role === 'worker' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <HardHat className="w-3.5 h-3.5" />
                  Sanitation Worker
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <User className="w-3.5 h-3.5" />
                  Registered Citizen
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details list */}
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-50">
            <span className="text-charcoal-500 flex items-center gap-2">
              <Mail className="w-4 h-4 text-charcoal-400" />
              Email Address
            </span>
            <span className="font-semibold text-charcoal-900 font-mono">{user.email}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-50">
            <span className="text-charcoal-500 flex items-center gap-2">
              <Phone className="w-4 h-4 text-charcoal-400" />
              Phone Number
            </span>
            <span className="font-semibold text-charcoal-900">{user.phone || 'Not provided'}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-50">
            <span className="text-charcoal-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-charcoal-400" />
              Account Created
            </span>
            <span className="font-semibold text-charcoal-900">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Sign Out Action */}
        <div className="pt-4 border-t border-charcoal-100">
          <button
            onClick={() => logout()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of EcoTrack
          </button>
        </div>
      </div>
    </div>
  );
};
