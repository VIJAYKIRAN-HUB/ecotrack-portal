import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { DashboardMetrics } from '../../types/index.js';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  Users,
  Copy,
  MapPin,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [categoryDist, setCategoryDist] = useState<any[]>([]);
  const [priorityDist, setPriorityDist] = useState<any[]>([]);
  const [statusDist, setStatusDist] = useState<any[]>([]);
  const [localityDist, setLocalityDist] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminOverview = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminOverview();
        if (res.success) {
          setMetrics(res.metrics);
          setTrends(res.trends || []);
          setCategoryDist(res.categoryDistribution || []);
          setPriorityDist(res.priorityDistribution || []);
          setStatusDist(res.statusDistribution || []);
          setLocalityDist(res.localityDistribution || []);
          setWorkers(res.workers || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminOverview();
  }, []);

  const handleExportCsv = () => {
    window.location.href = '/api/admin/export-csv';
  };

  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-charcoal-500">Loading municipal operational analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-1">
            <Shield className="w-3.5 h-3.5" /> Municipal Administration Control Room
          </div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            City Waste Operations Overview
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Real-time telemetry, worker dispatching, resolution analytics, and duplicate triage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-charcoal-200 bg-white hover:bg-charcoal-50 text-charcoal-800 text-xs font-semibold shadow-soft-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-forest-700" />
            Export Complaints CSV
          </button>
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold shadow-soft transition"
          >
            All Reports ({metrics?.totalComplaints || 0})
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-charcoal-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400 block mb-1">
            Total Complaints
          </span>
          <div className="text-2xl font-extrabold text-charcoal-900">
            {metrics?.totalComplaints || 0}
          </div>
          <span className="text-[10px] text-charcoal-500">
            {metrics?.totalValidComplaints} valid non-duplicates
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-charcoal-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
            Pending Review
          </span>
          <div className="text-2xl font-extrabold text-amber-600">
            {metrics?.pendingComplaints || 0}
          </div>
          <span className="text-[10px] text-charcoal-500">Awaiting verification</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-charcoal-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block mb-1">
            In Progress
          </span>
          <div className="text-2xl font-extrabold text-purple-700">
            {metrics?.inProgressComplaints || 0}
          </div>
          <span className="text-[10px] text-charcoal-500">Crews on-site</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-charcoal-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Resolved Clean
          </span>
          <div className="text-2xl font-extrabold text-emerald-700">
            {metrics?.resolvedComplaints || 0}
          </div>
          <span className="text-[10px] text-charcoal-500">Photo verified</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-charcoal-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 block mb-1">
            Overdue (&gt;48h)
          </span>
          <div className="text-2xl font-extrabold text-red-600">
            {metrics?.overdueComplaints || 0}
          </div>
          <span className="text-[10px] text-charcoal-500">High priority dispatch</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-charcoal-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700 block mb-1">
            Resolution Rate
          </span>
          <div className="text-2xl font-extrabold text-forest-800">
            {metrics?.resolutionRate || 0}%
          </div>
          <span className="text-[10px] text-charcoal-500">
            Avg: {metrics?.avgResolutionTimeHours || 0}h
          </span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-charcoal-200 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">
                14-Day Reporting & Cleanup Velocity
              </h3>
              <p className="text-xs text-charcoal-500">Complaints submitted vs resolved daily</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-forest-800 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-700" /> Submitted
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolved
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b4332" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1b4332" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.slice(5)}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  stroke="#1b4332"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSub)"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-3xl p-6 border border-charcoal-200 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 mb-1">Status Distribution</h3>
            <p className="text-xs text-charcoal-500 mb-4">Breakdown across all active records</p>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {statusDist.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-3 border-t border-charcoal-100">
            {statusDist.map((item, idx) => (
              <div key={item.status} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-charcoal-600 truncate">{item.status}:</span>
                <span className="font-bold text-charcoal-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category and Priority Bar Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Categories Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-charcoal-200 shadow-soft">
          <h3 className="text-sm font-bold text-charcoal-900 mb-1">
            Complaints by Waste Category
          </h3>
          <p className="text-xs text-charcoal-500 mb-4">Volume breakdown across city zones</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDist} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f2f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={130}
                  tick={{ fontSize: 11, fill: '#374151' }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#2d6a4f" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sanitation Worker Workload Table */}
        <div className="bg-white rounded-3xl p-6 border border-charcoal-200 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-charcoal-900">
                Sanitation Worker Deployment & Load
              </h3>
              <Link
                to="/admin/workers"
                className="text-xs font-semibold text-forest-700 hover:text-forest-900"
              >
                Manage Workers →
              </Link>
            </div>
            <p className="text-xs text-charcoal-500 mb-4">Active task queue and resolution performance</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-charcoal-50 text-charcoal-600 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Officer</th>
                    <th className="py-2 px-3">Active Tasks</th>
                    <th className="py-2 px-3">Resolved</th>
                    <th className="py-2 px-3">Avg Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {workers.map((w) => (
                    <tr key={w.id} className="hover:bg-charcoal-50/50">
                      <td className="py-2.5 px-3 font-semibold text-charcoal-900">
                        {w.name}
                        <div className="text-[10px] text-charcoal-400 font-normal">{w.email}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          {w.activeTasks} active
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-emerald-700">
                        {w.completedTasks} cleaned
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600 font-mono">
                        {w.avgResolutionHours}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-charcoal-100 flex items-center justify-between text-xs text-charcoal-500">
            <span>{workers.length} active sanitation personnel</span>
            <Link
              to="/admin/duplicates"
              className="font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate Detection Triage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
