import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Complaint } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import {
  ArrowLeft,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  Play,
  X,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const WorkerTaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [task, setTask] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolution Form State
  const [resolutionNote, setResolutionNote] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [markingInProgress, setMarkingInProgress] = useState(false);

  const fetchTask = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getComplaint(id);
      if (res.success && res.complaint) {
        setTask(res.complaint);
      }
    } catch (err: any) {
      error(err.message || 'Task not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleMarkInProgress = async () => {
    if (!task) return;
    setMarkingInProgress(true);
    try {
      await api.markTaskInProgress(task.id, 'Sanitation worker arrived on-site with compactor truck.');
      success('Task marked as In Progress. Cleaning underway.');
      fetchTask();
    } catch (err: any) {
      error(err.message || 'Failed to update progress');
    } finally {
      setMarkingInProgress(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        error('File exceeds 10MB limit.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleResolveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (!resolutionNote.trim()) {
      error('Please enter a resolution note describing the cleanup.');
      return;
    }

    setResolving(true);
    try {
      const formData = new FormData();
      formData.append('resolutionNote', resolutionNote);
      if (photoFile) {
        formData.append('afterPhoto', photoFile);
      }

      await api.resolveTask(task.id, formData);
      success('Cleanup verified! Task marked as Resolved.');
      navigate('/worker/history');
    } catch (err: any) {
      error(err.message || 'Failed to resolve task');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-charcoal-500">Loading task sheet...</p>
      </div>
    );
  }

  if (!task) return null;

  const beforeImage = task.images?.find((img) => img.image_type === 'before');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/worker/tasks')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-charcoal-800 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Queue
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-charcoal-900 font-mono tracking-tight">
              {task.public_complaint_id}
            </h2>
            <StatusBadge status={task.status} size="lg" />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        {task.status === 'Assigned' && (
          <button
            type="button"
            disabled={markingInProgress}
            onClick={handleMarkInProgress}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-soft transition disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {markingInProgress ? 'Updating...' : 'Start Cleaning (Mark In Progress)'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Complaint Details & Before Photo */}
        <div className="space-y-6">
          {/* Details Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-charcoal-200 shadow-soft space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-md">
                {task.category}
              </span>
              <h3 className="text-lg font-bold text-charcoal-900 mt-2">{task.title}</h3>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">{task.description}</p>
            </div>

            <div className="pt-4 border-t border-charcoal-100 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-charcoal-700">
                <MapPin className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-charcoal-900">{task.locality}</span>
                  <span className="text-charcoal-600">{task.address}</span>
                </div>
              </div>

              {task.latitude && task.longitude && (
                <div className="text-[11px] font-mono text-charcoal-500 pl-6">
                  Coordinates: {task.latitude.toFixed(5)}, {task.longitude.toFixed(5)}
                </div>
              )}
            </div>
          </div>

          {/* Citizen's Before Photo */}
          <div className="bg-white rounded-3xl p-6 border border-charcoal-200 shadow-soft">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-forest-700" />
              Original Evidence (Before Cleaning)
            </h4>
            <div className="rounded-2xl overflow-hidden border border-charcoal-200 aspect-[4/3] bg-charcoal-100 flex items-center justify-center">
              {beforeImage ? (
                <img
                  src={beforeImage.image_url}
                  alt="Before cleanup evidence"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-charcoal-400">No original photo uploaded</span>
              )}
            </div>
          </div>

          {/* Mini Map */}
          {task.latitude && task.longitude && (
            <div className="bg-white rounded-3xl p-6 border border-charcoal-200 shadow-soft">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-forest-700" />
                Target Coordinates
              </h4>
              <div className="h-44 rounded-2xl overflow-hidden border border-charcoal-200">
                <MapContainer
                  center={[task.latitude, task.longitude]}
                  zoom={14}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[task.latitude, task.longitude]} icon={customIcon}>
                    <Popup>{task.address}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Resolution Form */}
        <div>
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft space-y-6 sticky top-24">
            <div className="border-b border-charcoal-100 pb-4">
              <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Submit Resolution & Cleanup Evidence
              </h3>
              <p className="text-xs text-charcoal-500 mt-1">
                Upload proof of cleaned site and record final notes to mark this task resolved.
              </p>
            </div>

            <form onSubmit={handleResolveTask} className="space-y-5">
              {/* After-cleaning Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                  After-Cleaning Photograph (Photo Proof)
                </label>

                {!photoPreview ? (
                  <div className="border-2 border-dashed border-charcoal-200 hover:border-emerald-600 rounded-2xl p-6 text-center transition bg-charcoal-50/50">
                    <Camera className="w-8 h-8 text-charcoal-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-charcoal-800">
                      Upload completion photo
                    </p>
                    <p className="text-[11px] text-charcoal-500 mt-0.5">
                      JPEG, PNG, or WebP. Verified before-and-after evidence.
                    </p>
                    <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-forest-800 text-white hover:bg-forest-900 cursor-pointer shadow-soft-sm transition">
                      <Upload className="w-3.5 h-3.5" />
                      Take / Select Photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-emerald-50 aspect-[4/3]">
                    <img
                      src={photoPreview}
                      alt="Resolution preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2.5 right-2.5 p-1 rounded-full bg-charcoal-900/80 text-white hover:bg-charcoal-900 shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-200 text-[11px] font-bold">
                      ✓ Resolution Evidence Ready
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution Notes */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Resolution Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Area completely cleared of rotting waste. Disinfected footpath with bleaching powder and lime. Waste transported to dry-waste segregation unit."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={resolving}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft transition disabled:opacity-50"
              >
                {resolving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {resolving ? 'Marking Resolved...' : 'Complete & Mark Task Resolved'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
