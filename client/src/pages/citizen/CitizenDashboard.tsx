import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Complaint } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCitizenData = async () => {
      try {
        setLoading(true);
        const res = await api.getComplaints({ limit: 10 });
        if (res.success && res.data) {
          setComplaints(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCitizenData();
  }, []);

  // Compute metrics from actual citizen complaints
  const totalReports = complaints.length;
  const inProgressReports = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolvedReports = complaints.filter((c) => c.status === 'Resolved').length;
  const pendingReports = complaints.filter((c) => c.status === 'Submitted' || c.status === 'Verified').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-emerald-200 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Citizen Cleanliness Dashboard
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-forest-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Report neighbourhood waste accumulation and track municipal cleanup in real time.
            Your reports keep our streets healthy and clean.
          </p>
          <div className="mt-5">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-bold text-xs sm:text-sm shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              Report New Waste Issue
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
              Total Reports
            </span>
            <FileText className="w-4 h-4 text-forest-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">{totalReports}</div>
          <div className="text-[11px] text-charcoal-500 mt-1">Submitted by you</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{pendingReports}</div>
          <div className="text-[11px] text-charcoal-500 mt-1">Awaiting verification</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
              In Progress
            </span>
            <AlertCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">{inProgressReports}</div>
          <div className="text-[11px] text-charcoal-500 mt-1">Sanitation crew dispatched</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
              Resolved Clean
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{resolvedReports}</div>
          <div className="text-[11px] text-charcoal-500 mt-1">Verified with photos</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-charcoal-200 shadow-soft overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-charcoal-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-charcoal-900">Your Recent Reports</h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Live status tracking of complaints you have logged
            </p>
          </div>
          <Link
            to="/my-complaints"
            className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-900"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Loading your complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto mb-3">
              🌿
            </div>
            <h4 className="text-sm font-bold text-charcoal-900 mb-1">No waste reports yet</h4>
            <p className="text-xs text-charcoal-500 mb-4">
              Help keep your neighbourhood clean by submitting your first report.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-forest-800 text-white hover:bg-forest-900 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Report Waste
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 uppercase font-semibold border-b border-charcoal-100">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title & Locality</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-charcoal-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-800">
                      {c.public_complaint_id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-charcoal-800">{c.category}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-charcoal-900 line-clamp-1">{c.title}</div>
                      <div className="text-[11px] text-charcoal-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-charcoal-400 shrink-0" />
                        <span>{c.locality}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-500">
                      {new Date(c.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:text-forest-900"
                      >
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
