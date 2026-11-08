import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Complaint, ComplaintStatus, WasteCategory } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import {
  Search,
  Filter,
  X,
  Edit2,
  Trash2,
  ExternalLink,
  PlusCircle,
  MapPin,
  Calendar,
  RotateCcw,
} from 'lucide-react';

export const MyComplaintsPage: React.FC = () => {
  const { success, error } = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Withdraw/Delete confirmation modal state
  const [withdrawTarget, setWithdrawTarget] = useState<Complaint | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.getComplaints({
        page,
        limit: 10,
        search,
        category: selectedCategory,
        status: selectedStatus,
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
  }, [page, selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedStatus('');
    setPage(1);
  };

  const handleWithdrawComplaint = async () => {
    if (!withdrawTarget) return;

    try {
      await api.deleteComplaint(withdrawTarget.id, 'Withdrawn by citizen from dashboard');
      success(`Complaint ${withdrawTarget.public_complaint_id} has been withdrawn.`);
      setIsConfirmOpen(false);
      setWithdrawTarget(null);
      fetchComplaints();
    } catch (err: any) {
      error(err.message || 'Failed to withdraw complaint');
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            My Waste Reports
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage, edit, track, or withdraw your reported waste incidents.
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-soft transition"
        >
          <PlusCircle className="w-4 h-4" />
          Report Waste
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-charcoal-200 shadow-soft space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-charcoal-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Complaint ID (e.g. ECO-2026), title, or location..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-xl border border-charcoal-200 py-2 px-3 bg-white text-charcoal-700 focus:outline-none focus:border-forest-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-xl border border-charcoal-200 py-2 px-3 bg-white text-charcoal-700 focus:outline-none focus:border-forest-700"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>

            {(search || selectedCategory || selectedStatus) && (
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
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-charcoal-100 text-charcoal-600 flex items-center justify-center mx-auto mb-3">
              🔍
            </div>
            <h4 className="text-sm font-bold text-charcoal-900 mb-1">No reports found</h4>
            <p className="text-xs text-charcoal-500 mb-4">
              Try adjusting your search filters or submit a new report.
            </p>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-forest-700 hover:text-forest-900 underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 uppercase font-semibold border-b border-charcoal-200">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title & Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
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
                        <span>{c.address}, {c.locality}</span>
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
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="px-2.5 py-1 rounded-lg bg-charcoal-100 hover:bg-charcoal-200 font-semibold text-charcoal-700 transition"
                        >
                          Details
                        </Link>

                        {/* Citizen can edit if status is still 'Submitted' */}
                        {c.status === 'Submitted' && (
                          <Link
                            to={`/complaints/${c.id}/edit`}
                            className="p-1 rounded-lg text-charcoal-500 hover:text-forest-700 hover:bg-forest-50 transition"
                            title="Edit Report"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        {/* Citizen can withdraw if not yet resolved */}
                        {c.status !== 'Resolved' && c.status !== 'Withdrawn' && (
                          <button
                            type="button"
                            onClick={() => {
                              setWithdrawTarget(c);
                              setIsConfirmOpen(true);
                            }}
                            className="p-1 rounded-lg text-charcoal-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Withdraw Complaint"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-charcoal-50 border-t border-charcoal-100 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} reports)
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Withdraw Waste Report?"
        message={`Are you sure you want to withdraw complaint ${withdrawTarget?.public_complaint_id}? Municipal authorities will be notified that this report is no longer active.`}
        confirmLabel="Yes, Withdraw Report"
        isDestructive={true}
        onConfirm={handleWithdrawComplaint}
        onCancel={() => {
          setIsConfirmOpen(false);
          setWithdrawTarget(null);
        }}
      />
    </div>
  );
};
