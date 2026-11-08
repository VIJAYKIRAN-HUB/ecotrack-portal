import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { DuplicatePair } from '../../types/index.js';
import {
  Copy,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertTriangle,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const DuplicateDetectionPage: React.FC = () => {
  const { success, error } = useToast();
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [statusFilter, setStatusFilter] = useState<'suspected' | 'confirmed' | 'rejected'>('suspected');
  const [loading, setLoading] = useState(true);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const res = await api.getDuplicates(statusFilter);
      if (res.success && res.duplicates) {
        setDuplicates(res.duplicates);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch duplicate pairs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, [statusFilter]);

  const handleConfirm = async (duplicateId: number, primaryId: number) => {
    try {
      await api.confirmDuplicate(duplicateId, primaryId);
      success('Complaint successfully marked and linked as duplicate.');
      fetchDuplicates();
    } catch (err: any) {
      error(err.message || 'Failed to confirm duplicate');
    }
  };

  const handleReject = async (duplicateId: number, primaryId: number) => {
    try {
      await api.rejectDuplicate(duplicateId, primaryId);
      success('Duplicate flag dismissed as distinct issue.');
      fetchDuplicates();
    } catch (err: any) {
      error(err.message || 'Failed to reject duplicate');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <Copy className="w-6 h-6 text-forest-700" />
            Duplicate Complaint Detection Triage
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Rule-based multi-factor engine comparing text similarity, category agreement, and Haversine geo-distance.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="inline-flex p-1 bg-charcoal-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('suspected')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              statusFilter === 'suspected' ? 'bg-white text-forest-900 shadow-sm' : 'text-charcoal-600'
            }`}
          >
            Suspected Matches
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              statusFilter === 'confirmed' ? 'bg-white text-forest-900 shadow-sm' : 'text-charcoal-600'
            }`}
          >
            Confirmed Duplicates
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              statusFilter === 'rejected' ? 'bg-white text-forest-900 shadow-sm' : 'text-charcoal-600'
            }`}
          >
            Dismissed False Positives
          </button>
        </div>
      </div>

      {/* Duplicate Pairs Cards */}
      <div className="space-y-5">
        {loading ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-charcoal-200">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Evaluating similarity indexes...</p>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-charcoal-200 max-w-md mx-auto">
            <Sparkles className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-charcoal-900">
              No {statusFilter} duplicate pairs
            </h4>
            <p className="text-xs text-charcoal-500 mt-1">
              All reported complaints are currently unique and verified.
            </p>
          </div>
        ) : (
          duplicates.map((pair) => (
            <div
              key={pair.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-charcoal-200 shadow-soft space-y-5"
            >
              {/* Card Header with Score */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-charcoal-100">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-extrabold text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {pair.similarity_score}% Similarity Score
                  </div>
                  <span className="text-xs font-semibold text-charcoal-500">
                    Flagged by Auto-Similarity Engine
                  </span>
                </div>

                {pair.status === 'suspected' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleReject(pair.duplicate_complaint_id, pair.primary_complaint_id)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50 text-xs font-semibold transition"
                    >
                      <XCircle className="w-3.5 h-3.5 text-charcoal-400" />
                      Not Duplicate
                    </button>
                    <button
                      onClick={() =>
                        handleConfirm(pair.duplicate_complaint_id, pair.primary_complaint_id)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold shadow-soft transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Confirm Duplicate
                    </button>
                  </div>
                )}
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Report */}
                <div className="p-4 rounded-2xl bg-forest-50/40 border border-forest-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-forest-800 bg-forest-100/80 px-2 py-0.5 rounded-md">
                      Primary Complaint
                    </span>
                    <Link
                      to={`/complaints/${pair.primary_complaint_id}`}
                      target="_blank"
                      className="text-[11px] font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1"
                    >
                      View Record <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="font-mono font-bold text-sm text-forest-950 mb-1">
                    {pair.primary_public_id}
                  </div>
                  <h4 className="text-xs font-bold text-charcoal-900 mb-1.5">
                    {pair.primary_title}
                  </h4>
                  <div className="text-[11px] text-charcoal-500 flex items-center gap-2">
                    <span>Category: <strong>{pair.primary_category}</strong></span>
                    <span>·</span>
                    <span>Status: <strong>{pair.primary_status}</strong></span>
                  </div>
                </div>

                {/* Suspected Duplicate Report */}
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      Suspected Duplicate
                    </span>
                    <Link
                      to={`/complaints/${pair.duplicate_complaint_id}`}
                      target="_blank"
                      className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                    >
                      View Record <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="font-mono font-bold text-sm text-amber-950 mb-1">
                    {pair.duplicate_public_id}
                  </div>
                  <h4 className="text-xs font-bold text-charcoal-900 mb-1.5">
                    {pair.duplicate_title}
                  </h4>
                  <div className="text-[11px] text-charcoal-500 flex items-center gap-2">
                    <span>Category: <strong>{pair.duplicate_category}</strong></span>
                    <span>·</span>
                    <span>Status: <strong>{pair.duplicate_status}</strong></span>
                  </div>
                </div>
              </div>

              {/* Match Factors Breakdown */}
              <div className="p-3.5 bg-charcoal-50 rounded-2xl border border-charcoal-100">
                <div className="text-xs font-bold text-charcoal-700 mb-2">
                  Detection Rationale & Match Breakdown:
                </div>
                <div className="flex flex-wrap gap-2">
                  {pair.match_reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-charcoal-200 text-charcoal-800 shadow-soft-sm"
                    >
                      ✓ {reason}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
