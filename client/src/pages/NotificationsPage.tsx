import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { Notification } from '../types/index.js';
import { Bell, CheckCheck, Trash2, ExternalLink, Clock } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      success('All notifications marked as read.');
    } catch (err: any) {
      error(err.message || 'Failed to mark notifications read');
    }
  };

  const handleClickNotification = async (n: Notification) => {
    if (!n.is_read) {
      await api.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: 1 } : item))
      );
    }
    if (n.related_complaint_id) {
      navigate(`/complaints/${n.related_complaint_id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-forest-700" />
            In-App Notifications
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Real-time updates regarding status changes, crew assignments, and resolutions.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-charcoal-200 bg-white hover:bg-charcoal-50 text-xs font-semibold text-charcoal-700 transition"
          >
            <CheckCheck className="w-3.5 h-3.5 text-forest-700" />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-charcoal-200 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto">
            <Bell className="w-10 h-10 text-charcoal-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-charcoal-800">No notifications yet</h4>
            <p className="text-xs text-charcoal-500 mt-1">
              You will receive automatic alerts when municipal teams review or clean your reports.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-charcoal-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`p-4 sm:p-5 hover:bg-charcoal-50 cursor-pointer transition flex items-start gap-3.5 ${
                  !n.is_read ? 'bg-forest-50/30' : ''
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    !n.is_read ? 'bg-forest-600' : 'bg-charcoal-300'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-charcoal-900 truncate">
                      {n.title}
                    </h4>
                    <span className="text-[11px] text-charcoal-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-600 mt-1 leading-relaxed">{n.message}</p>
                  {n.related_public_id && (
                    <span className="inline-block mt-2 text-[11px] font-mono font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md">
                      Report: {n.related_public_id}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
