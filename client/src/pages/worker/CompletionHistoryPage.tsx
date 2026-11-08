import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Complaint } from '../../types/index.js';
import { CheckCircle2, MapPin, Calendar, Clock, ExternalLink } from 'lucide-react';

export const CompletionHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkerHistory()
      .then((res) => {
        if (res.success && res.history) {
          setHistory(res.history);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          Completed Resolution History
        </h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Verified collection tasks and before-and-after photographic evidence archived in municipal records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-16 text-center">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Loading resolution history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="col-span-2 p-16 text-center bg-white rounded-3xl border border-charcoal-200 max-w-sm mx-auto">
            <CheckCircle2 className="w-10 h-10 text-charcoal-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-charcoal-800">No completed tasks yet</p>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-charcoal-200 shadow-soft space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
                <span className="font-mono font-bold text-xs text-forest-800">
                  {item.public_complaint_id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Cleaned & Verified
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-charcoal-900">{item.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                  <span>{item.address}, {item.locality}</span>
                </div>
              </div>

              {/* Before and After Thumbnail Pair */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl overflow-hidden border border-red-200 bg-red-50 text-center">
                  <span className="text-[10px] font-bold text-red-700 block py-1 bg-red-100/60">
                    BEFORE
                  </span>
                  <div className="aspect-[4/3] bg-charcoal-100 flex items-center justify-center">
                    {item.before_image_url ? (
                      <img
                        src={item.before_image_url}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-charcoal-400">No photo</span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 block py-1 bg-emerald-100/60">
                    AFTER
                  </span>
                  <div className="aspect-[4/3] bg-emerald-50/50 flex items-center justify-center">
                    {item.after_image_url ? (
                      <img
                        src={item.after_image_url}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-charcoal-400">No photo</span>
                    )}
                  </div>
                </div>
              </div>

              {item.resolution_note && (
                <p className="text-xs text-emerald-900 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60 leading-relaxed">
                  <strong>Notes:</strong> {item.resolution_note}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between text-[11px] text-charcoal-400 border-t border-charcoal-100">
                <span>Resolved: {item.resolved_at ? new Date(item.resolved_at).toLocaleDateString() : ''}</span>
                <Link
                  to={`/complaints/${item.id}`}
                  className="font-semibold text-forest-700 hover:text-forest-900 flex items-center gap-1"
                >
                  View Details <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
