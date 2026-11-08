import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Filter, AlertCircle, ExternalLink, List, Map as MapIcon } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge.js';
import { PriorityBadge } from '../common/PriorityBadge.js';

interface MapPoint {
  id: number;
  public_complaint_id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  address: string;
  locality: string;
  latitude: number;
  longitude: number;
  before_image_url?: string;
}

interface ComplaintMapProps {
  points: MapPoint[];
  loading?: boolean;
}

// Marker icon generator
function createColorPin(color: string) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      background-color: ${color};
      width: 26px;
      height: 26px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "><div style="
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      transform: rotate(45deg);
    "></div></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

const pins = {
  urgent: createColorPin('#ef4444'),
  high: createColorPin('#f59e0b'),
  medium: createColorPin('#3b82f6'),
  low: createColorPin('#10b981'),
  resolved: createColorPin('#059669'),
};

export const ComplaintMap: React.FC<ComplaintMapProps> = ({ points, loading = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapOnline, setMapOnline] = useState(true);

  const categories = [
    'Garbage Accumulation',
    'Overflowing Dustbin',
    'Missed Waste Collection',
    'Illegal Dumping',
    'Construction Waste',
    'Plastic Waste',
    'Organic Waste',
    'Electronic Waste',
  ];

  const filteredPoints = points.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    return true;
  });

  const defaultCenter: [number, number] =
    filteredPoints.length > 0 && filteredPoints[0].latitude && filteredPoints[0].longitude
      ? [filteredPoints[0].latitude, filteredPoints[0].longitude]
      : [12.9716, 77.5946];

  const getMarkerIcon = (point: MapPoint) => {
    if (point.status === 'Resolved') return pins.resolved;
    if (point.priority === 'urgent') return pins.urgent;
    if (point.priority === 'high') return pins.high;
    if (point.priority === 'medium') return pins.medium;
    return pins.low;
  };

  return (
    <div className="bg-white rounded-2xl border border-charcoal-200 shadow-soft overflow-hidden">
      {/* Top Controls & Filters Bar */}
      <div className="p-4 bg-charcoal-50/70 border-b border-charcoal-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-forest-700" />
          <span className="text-xs font-semibold text-charcoal-800">Filter Reports:</span>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs rounded-lg border border-charcoal-300 py-1.5 px-2.5 bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          >
            <option value="all">All Waste Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs rounded-lg border border-charcoal-300 py-1.5 px-2.5 bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Verified">Verified</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-charcoal-500 font-medium">
            Showing <strong className="text-charcoal-900">{filteredPoints.length}</strong> reports
          </span>

          <div className="inline-flex p-0.5 bg-charcoal-200/80 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                viewMode === 'map' ? 'bg-white text-forest-900 shadow-sm' : 'text-charcoal-600'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                viewMode === 'list' ? 'bg-white text-forest-900 shadow-sm' : 'text-charcoal-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && mapOnline && (
        <div className="h-[520px] w-full relative">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                tileerror: () => setMapOnline(false),
              }}
            />

            {filteredPoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={getMarkerIcon(point)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="w-64 p-3 font-sans">
                    {point.before_image_url && (
                      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg mb-2 bg-charcoal-100">
                        <img
                          src={point.before_image_url}
                          alt="Evidence thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-mono font-bold text-forest-800">
                        {point.public_complaint_id}
                      </span>
                      <PriorityBadge priority={point.priority} />
                    </div>
                    <h4 className="text-xs font-semibold text-charcoal-900 line-clamp-2 mb-1.5">
                      {point.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-charcoal-600 mb-2">
                      <MapPin className="w-3 h-3 text-charcoal-400 shrink-0" />
                      <span className="truncate">{point.locality}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-charcoal-100 pt-2 mt-2">
                      <StatusBadge status={point.status} size="sm" />
                      <Link
                        to={`/complaints/${point.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:text-forest-900"
                      >
                        Details <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map legend */}
          <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-soft-lg border border-charcoal-200 text-xs">
            <div className="font-semibold text-charcoal-800 mb-1.5">Map Marker Key</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-charcoal-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Urgent
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High Priority
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Medium / Normal
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Resolved Clean
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graceful Fallback List View (or offline fallback) */}
      {(viewMode === 'list' || !mapOnline) && (
        <div className="p-4">
          {!mapOnline && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Map tiles unavailable in offline mode. Displaying geographic complaint directory below.
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 text-charcoal-600 uppercase font-semibold border-b border-charcoal-200">
                <tr>
                  <th className="py-2.5 px-3">Complaint ID</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Title & Location</th>
                  <th className="py-2.5 px-3">Coordinates</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {filteredPoints.map((p) => (
                  <tr key={p.id} className="hover:bg-charcoal-50/50 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-forest-800">
                      {p.public_complaint_id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-charcoal-800">{p.category}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-charcoal-900">{p.title}</div>
                      <div className="text-[11px] text-charcoal-500">{p.address}, {p.locality}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-charcoal-600">
                      {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3">
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/complaints/${p.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:text-forest-900"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
