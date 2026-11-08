import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { History, Clock, User, Shield, HardHat } from 'lucide-react';

export const ActivityLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.getActivityLogs(page, 20)
      .then((res) => {
        if (res.success && res.logs) {
          setLogs(res.logs);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-forest-700" />
          System Audit & Activity Logs
        </h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Immutable event log of all administrative actions, worker updates, and citizen submissions.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-charcoal-200 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Retrieving audit events...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-xs text-charcoal-400">No activity logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 uppercase font-semibold border-b border-charcoal-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-charcoal-50/50">
                    <td className="py-3 px-4 font-mono text-[11px] text-charcoal-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-900 whitespace-nowrap">
                      {log.user_name || 'System Auto'}
                      {log.user_role && (
                        <span className="ml-1.5 text-[10px] uppercase font-normal text-charcoal-500 bg-charcoal-100 px-1.5 py-0.5 rounded">
                          {log.user_role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-forest-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-charcoal-700 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 bg-charcoal-50 border-t border-charcoal-100 flex items-center justify-between text-xs">
            <span className="text-charcoal-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-700 font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-charcoal-200 bg-white text-charcoal-700 font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
