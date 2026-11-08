import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Complaint } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import {
  HardHat,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Camera,
  Play,
} from 'lucide-react';

export const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [history, setHistory] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkerData = async () => {
      try {
        setLoading(true);
        const [tasksRes, historyRes] = await Promise.all([
          api.getWorkerTasks(),
          api.getWorkerHistory(),
        ]);

        if (tasksRes.success && tasksRes.tasks) {
          setTasks(tasksRes.tasks);
        }
        if (historyRes.success && historyRes.history) {
          setHistory(historyRes.history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerData();
  }, []);

  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingAcceptCount = tasks.filter((t) => t.status === 'Assigned').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-forest-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-amber-200 text-xs font-semibold mb-3">
            <HardHat className="w-3.5 h-3.5" /> Field Sanitation Operations
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Officer {user?.name}
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
            You currently have{' '}
            <strong className="text-white font-bold">{tasks.length} active cleanup tasks</strong>{' '}
            assigned to your dispatch unit.
          </p>
          <div className="mt-5">
            <Link
              to="/worker/tasks"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm shadow-md transition"
            >
              View Active Task Queue ({tasks.length})
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-1">
            Total Active Tasks
          </div>
          <div className="text-3xl font-extrabold text-charcoal-900">{tasks.length}</div>
          <div className="text-[11px] text-charcoal-500 mt-1">Assigned to you</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            Awaiting Acceptance
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{pendingAcceptCount}</div>
          <div className="text-[11px] text-charcoal-500 mt-1">Pending on-site arrival</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
            In Progress
          </div>
          <div className="text-3xl font-extrabold text-purple-700">{inProgressCount}</div>
          <div className="text-[11px] text-charcoal-500 mt-1">Cleaning currently underway</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            Completed Resolutions
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">{history.length}</div>
          <div className="text-[11px] text-charcoal-500 mt-1">Cleaned & photo-verified</div>
        </div>
      </div>

      {/* Priority Tasks Queue */}
      <div className="bg-white rounded-3xl border border-charcoal-200 shadow-soft overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-charcoal-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-charcoal-900">Your Assigned Task Queue</h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Prioritized by severity (Urgent & High first)
            </p>
          </div>
          <Link
            to="/worker/tasks"
            className="text-xs font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1"
          >
            All Tasks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Loading your tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-charcoal-900">All tasks completed!</h4>
            <p className="text-xs text-charcoal-500 mt-1">
              No pending waste collection tasks assigned to your queue at this moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-charcoal-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 sm:p-6 hover:bg-charcoal-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  {task.before_image_url ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-charcoal-100 shrink-0 border border-charcoal-200">
                      <img
                        src={task.before_image_url}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-charcoal-100 flex items-center justify-center shrink-0 text-charcoal-400">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-forest-800">
                        {task.public_complaint_id}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                    <h4 className="text-sm font-bold text-charcoal-900 truncate">{task.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                      <span>{task.address}, {task.locality}</span>
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <Link
                    to={`/worker/tasks/${task.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-soft transition"
                  >
                    Resolve Task →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
