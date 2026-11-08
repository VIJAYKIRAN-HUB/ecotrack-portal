import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet icon paths in bundlers
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  address: string;
  onAddressChange: (address: string) => void;
  locality: string;
  onLocalityChange: (locality: string) => void;
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
  address,
  onAddressChange,
  locality,
  onLocalityChange,
}) => {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapOnline, setMapOnline] = useState(true);

  // Default coordinate: Bangalore city center
  const defaultCenter: [number, number] = [12.9716, 77.5946];
  const currentPos: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter;

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        onChange(lat, lng);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError('Permission denied. Please allow location access or type address manually.');
        } else {
          setGeoError('Could not determine your location. Please enter coordinates or address below.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <label className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-forest-700" />
          Location & Coordinates
        </label>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-700 bg-forest-50 hover:bg-forest-100 border border-forest-200/80 px-3 py-1.5 rounded-xl transition"
        >
          <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
          {geoLoading ? 'Detecting Location...' : 'Use My Current GPS Location'}
        </button>
      </div>

      {geoError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Interactive Map Picker */}
      <div className="h-56 rounded-xl overflow-hidden border border-charcoal-200 relative shadow-inner">
        {mapOnline ? (
          <MapContainer
            center={currentPos}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                tileerror: () => setMapOnline(false),
              }}
            />
            {latitude && longitude && <Marker position={[latitude, longitude]} icon={customIcon} />}
            <MapClickHandler onSelect={onChange} />
          </MapContainer>
        ) : (
          <div className="h-full bg-charcoal-50 flex flex-col items-center justify-center p-6 text-center">
            <MapPin className="w-8 h-8 text-charcoal-400 mb-2" />
            <p className="text-xs font-semibold text-charcoal-700">Map tiles unavailable in offline mode</p>
            <p className="text-[11px] text-charcoal-500 mt-1">
              Please enter your locality, address description, and optional coordinates below.
            </p>
          </div>
        )}

        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm border border-charcoal-200 text-[11px] text-charcoal-700 font-medium">
          💡 Click anywhere on map to set pin
        </div>
      </div>

      {/* Manual Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-charcoal-700 mb-1">
            Locality / Neighbourhood <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={locality}
            onChange={(e) => onLocalityChange(e.target.value)}
            placeholder="e.g. Indiranagar, Koramangala, Whitefield"
            className="w-full px-3 py-2 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-charcoal-700 mb-1">
            Street Address or Landmark <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="e.g. 100 Feet Rd, near Metro Gate B"
            className="w-full px-3 py-2 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600 bg-white"
          />
        </div>
      </div>

      {/* Latitude & Longitude inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-charcoal-500 mb-0.5">Latitude (Decimal)</label>
          <input
            type="number"
            step="any"
            value={latitude !== null ? latitude : ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0, longitude || 0)}
            placeholder="12.9784"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-charcoal-200 focus:outline-none focus:border-forest-600 bg-charcoal-50/50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-charcoal-500 mb-0.5">Longitude (Decimal)</label>
          <input
            type="number"
            step="any"
            value={longitude !== null ? longitude : ''}
            onChange={(e) => onChange(latitude || 0, parseFloat(e.target.value) || 0)}
            placeholder="77.6408"
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-charcoal-200 focus:outline-none focus:border-forest-600 bg-charcoal-50/50"
          />
        </div>
      </div>
    </div>
  );
};
