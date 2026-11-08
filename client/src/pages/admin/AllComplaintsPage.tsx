import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Complaint, WasteCategory } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import {
  Search,
  Filter,
  Download,
  X,
  ExternalLink,
  MapPin,
  CheckCircle2,
  HardHat,
  ArrowUpDown,
} from 'lucide-react';

export const AllComplaintsPage: React.FC = () => {
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Assignment Modal
  const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.getComplaints({
        page,
        limit: 12,
        search,
        category,
        status,
        priority,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setComplaints(res.data);
        setTotalCount(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, category, status, priority, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setPriority('');
    setPage(1);
  };

  const handleVerify = async (complaintId: number) => {
    try {
      await api.updateStatus(complaintId, 'Verified', 'Verified by administrator');
      success('Complaint verified.');
      fetchComplaints();
    } catch (err: any) {
      error(err.message || 'Verification failed');
    }
  };

  const openAssignModal = async (c: Complaint) => {
    setAssignTarget(c);
    try {
      const res = await api.getAdminWorkers();
      if (res.success && res.workers) {
        setWorkersList(res.workers);
        if (res.workers.length > 0) {
          setSelectedWorkerId(res.workers[0].id);
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch worker list');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget || !selectedWorkerId) return;

    setAssigning(true);
    try {
      await api.assignWorker(assignTarget.id, Number(selectedWorkerId), assignNotes);
      success(`Assigned ${assignTarget.public_complaint_id} to worker.`);
      setAssignTarget(null);
      fetchComplaints();
    } catch (err: any) {
      error(err.message || 'Failed to assign worker');
    } finally {
      setAssigning(false);
    }
  };

  const categories: WasteCategory[] = [
    'Garbage Accumulation',
    'Overflowing Dustbin',
    'Missed Waste Collection',
    'Illegal Dumping',
    'Construction Waste',
    'Plastic Waste',
    'Organic Waste',
    'Electronic Waste',
    'Other',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            All Municipal Waste Reports
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Full administrative database view with verification, dispatch, and triage tools.
          </p>
        </div>

        <button
          onClick={() => (window.location.href = '/api/admin/export-csv')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-charcoal-200 bg-white hover:bg-charcoal-50 text-charcoal-800 font-semibold text-xs shadow-soft transition"
        >
          <Download className="w-4 h-4 text-forest-700" />
          Export All Records (CSV)
        </button>
      </div>

      {/* Multi-Filter Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-charcoal-200 shadow-soft space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-charcoal-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID (e.g. ECO-2026), title, locality, or citizen..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-xl border border-charcoal-200 py-2 px-2.5 bg-white text-charcoal-700 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-xl border border-charcoal-200 py-2 px-2.5 bg-white text-charcoal-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>

            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-xl border border-charcoal-200 py-2 px-2.5 bg-white text-charcoal-700 focus:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {(search || category || status || priority) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-2 text-charcoal-500 hover:text-charcoal-800 hover:bg-charcoal-100 rounded-xl transition"
                title="Clear Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-3xl border border-charcoal-200 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Querying database records...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto">
            <h4 className="text-sm font-bold text-charcoal-800">No matching complaints found</h4>
            <p className="text-xs text-charcoal-500 mt-1 mb-4">
              Try resetting your search query or filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-forest-700 hover:text-forest-900 underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 uppercase font-semibold border-b border-charcoal-200">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title & Locality</th>
                  <th className="py-3 px-4">Citizen</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Worker</th>
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
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-charcoal-900 truncate">{c.title}</div>
                      <div className="text-[11px] text-charcoal-500 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-charcoal-400 shrink-0" />
                        <span>{c.locality}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-700 font-medium">
                      {c.citizen_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-700">
                      {c.assigned_worker_name ? (
                        <span className="font-semibold text-charcoal-900">
                          {c.assigned_worker_name}
                        </span>
                      ) : (
                        <span className="text-charcoal-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {c.status === 'Submitted' && (
                          <button
                            type="button"
                            onClick={() => handleVerify(c.id)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            title="Verify Complaint"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {['Submitted', 'Verified', 'Reopened'].includes(c.status) && (
                          <button
                            type="button"
                            onClick={() => openAssignModal(c)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition"
                            title="Assign Sanitation Worker"
                          >
                            <HardHat className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <Link
                          to={`/complaints/${c.id}`}
                          className="px-2.5 py-1 rounded-lg bg-charcoal-100 hover:bg-charcoal-200 font-semibold text-charcoal-700 transition"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-charcoal-50 border-t border-charcoal-100 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount}{' '}
              total complaints)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-700 font-medium disabled:opacity-50 hover:bg-charcoal-50 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-700 font-medium disabled:opacity-50 hover:bg-charcoal-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Worker Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft-xl border border-charcoal-200">
            <h3 className="text-base font-bold text-charcoal-900 mb-1">
              Assign Sanitation Worker
            </h3>
            <p className="text-xs text-charcoal-500 mb-4">
              Dispatch complaint <strong className="text-charcoal-900">{assignTarget.public_complaint_id}</strong> ({assignTarget.category})
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Select Sanitation Officer
                </label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-300 bg-white"
                >
                  {workersList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.activeTasks} active tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Dispatch Notes
                </label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Bring 2-ton compactor truck for commercial waste"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 bg-charcoal-100 hover:bg-charcoal-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-forest-800 hover:bg-forest-900 shadow-sm transition"
                >
                  {assigning ? 'Dispatching...' : 'Dispatch Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
