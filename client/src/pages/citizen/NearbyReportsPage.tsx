import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { ComplaintMap } from '../../components/map/ComplaintMap.js';
import { Compass, ShieldCheck } from 'lucide-react';

export const NearbyReportsPage: React.FC = () => {
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMapPoints()
      .then((res) => {
        if (res.success && res.points) {
          setPoints(res.points);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-forest-700" />
            Nearby Community Reports
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Explore reported waste incidents across your locality with privacy safeguards.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Privacy Protected (Citizen Info Masked)
        </div>
      </div>

      <ComplaintMap points={points} loading={loading} />
    </div>
  );
};
