import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { DashboardMetrics } from '../../types/index.js';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [localityDist, setLocalityDist] = useState<any[]>([]);
  const [categoryDist, setCategoryDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminAnalytics(30)
      .then((res) => {
        if (res.success) {
          setMetrics(res.metrics);
          setTrends(res.trends || []);
          setLocalityDist(res.localityDistribution || []);
          setCategoryDist(res.categoryDistribution || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-forest-700" />
            Operational Resolution Analytics
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Statistical performance indicators and service level telemetry.
          </p>
        </div>

        <button
          onClick={() => (window.location.href = '/api/admin/export-csv')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-charcoal-200 bg-white hover:bg-charcoal-50 text-charcoal-800 text-xs font-semibold shadow-soft transition"
        >
          <Download className="w-4 h-4 text-forest-700" />
          Export Report Dataset (CSV)
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-1">
            Valid Resolution Rate
          </div>
          <div className="text-3xl font-extrabold text-forest-900">{metrics?.resolutionRate || 0}%</div>
          <div className="text-[11px] text-charcoal-500 mt-1">
            Formula: (Resolved Valid / Total Valid) × 100
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-1">
            Average Resolution Time
          </div>
          <div className="text-3xl font-extrabold text-charcoal-900">
            {metrics?.avgResolutionTimeHours || 0} <span className="text-sm font-normal text-charcoal-500">hours</span>
          </div>
          <div className="text-[11px] text-charcoal-500 mt-1">Mean duration from filing to cleanup</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-1">
            Median Resolution Time
          </div>
          <div className="text-3xl font-extrabold text-charcoal-900">
            {metrics?.medianResolutionTimeHours || 0} <span className="text-sm font-normal text-charcoal-500">hours</span>
          </div>
          <div className="text-[11px] text-charcoal-500 mt-1">50th percentile operational benchmark</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
            Overdue Backlog (&gt;48h)
          </div>
          <div className="text-3xl font-extrabold text-red-600">
            {metrics?.overdueComplaints || 0}
          </div>
          <div className="text-[11px] text-charcoal-500 mt-1">Unresolved beyond standard SLA</div>
        </div>
      </div>

      {/* 30-Day Long-Term Trend Area Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft">
        <h3 className="text-sm font-bold text-charcoal-900 mb-1">
          30-Day Cumulative Waste Tonnage & Cleanup Trends
        </h3>
        <p className="text-xs text-charcoal-500 mb-6">Continuous tracking of citizen demand and municipal resolution capacity</p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(val) => val.slice(5)}
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="submitted"
                stroke="#1b4332"
                fill="#1b4332"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Locality Incident Volume Bar Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft">
        <h3 className="text-sm font-bold text-charcoal-900 mb-1">
          Incident Volume by Ward / Locality
        </h3>
        <p className="text-xs text-charcoal-500 mb-6">Identifies urban hotspots requiring increased sanitation patrols</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={localityDist}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f0" />
              <XAxis dataKey="locality" tick={{ fontSize: 11, fill: '#374151' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2d6a4f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
