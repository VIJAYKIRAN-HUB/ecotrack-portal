import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { ComplaintMap } from '../../components/map/ComplaintMap.js';
import { MapPin, Shield } from 'lucide-react';

export const MapViewPage: React.FC = () => {
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
            <MapPin className="w-6 h-6 text-forest-700" />
            Citywide Waste Incident Heatmap
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Geographic distribution of reported waste accumulation across municipal zones.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-900 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          Administrative GIS View
        </div>
      </div>

      <ComplaintMap points={points} loading={loading} />
    </div>
  );
};
