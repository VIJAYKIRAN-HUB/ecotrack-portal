import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LocationPicker } from '../../components/map/LocationPicker.js';
import {
  Camera,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  Send,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { WasteCategory, ComplaintPriority } from '../../types/index.js';

export const ReportWastePage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WasteCategory>('Garbage Accumulation');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Duplicate warning state
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Check for duplicates when title or locality changes
  useEffect(() => {
    if (title.trim().length < 5) {
      setDuplicateMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const res = await api.checkDuplicates({
          title,
          description: description || title,
          category,
          latitude,
          longitude,
        });
        if (res.success && res.matches) {
          setDuplicateMatches(res.matches);
        }
      } catch {
        // Silently handle duplicate check errors
      } finally {
        setCheckingDuplicates(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [title, category, latitude, longitude]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        error('File exceeds 10MB limit. Please select a smaller photo.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !address.trim() || !locality.trim()) {
      error('Please complete all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('address', address);
      formData.append('locality', locality);
      if (latitude !== null) formData.append('latitude', String(latitude));
      if (longitude !== null) formData.append('longitude', String(longitude));
      if (photoFile) {
        formData.append('photos', photoFile);
      }

      const res = await api.createComplaint(formData);
      if (res.success && res.complaint) {
        success(`Complaint ${res.complaint.public_complaint_id} submitted successfully!`);
        navigate(`/complaints/${res.complaint.id}`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to submit complaint. Please check your inputs.');
    } finally {
      setSubmitting(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-charcoal-800 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            Report Waste Accumulation
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Log an issue with municipal sanitation authorities for rapid dispatch and cleaning.
          </p>
        </div>
      </div>

      {/* Duplicate Warning Alert if detected */}
      {duplicateMatches.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl shadow-soft-sm text-xs text-amber-900 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-amber-950">
                Similar Report Already Detected Nearby ({duplicateMatches[0].similarityScore}% Match)
              </h4>
              <p className="mt-1 text-amber-800">
                A report matching your description (
                <strong className="font-semibold">{duplicateMatches[0].primaryPublicId}</strong>: "
                {duplicateMatches[0].primaryTitle}") is already registered.
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Link
                  to={`/complaints/${duplicateMatches[0].primaryComplaintId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-bold text-amber-950 underline hover:text-amber-800"
                >
                  View Existing Report <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-amber-700">· You may still proceed if this is a distinct issue.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft space-y-6">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-500 border-b border-charcoal-100 pb-2">
            1. Issue Details
          </h3>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Complaint Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Large garbage pile blocking pedestrian footpath"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700"
            />
            <div className="text-[11px] text-charcoal-400 mt-1 flex justify-between">
              <span>Be concise and descriptive.</span>
              <span>{title.length}/120</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Waste Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WasteCategory)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700 bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Severity / Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700 bg-white"
              >
                <option value="low">Low (Minor littering)</option>
                <option value="medium">Medium (Standard dustbin overflow)</option>
                <option value="high">High (Blocking passage, foul smell)</option>
                <option value="urgent">Urgent (Health hazard, hospital/school area)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the estimated quantity, hazardous materials (if any), how long it has been accumulating, and nearby landmarks..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700 resize-y"
            />
            <div className="text-[11px] text-charcoal-400 mt-1 flex justify-between">
              <span>Include any details that help sanitation crews bring the right vehicle.</span>
              <span>{description.length}/1000</span>
            </div>
          </div>
        </div>

        {/* Section 2: Geographic Location */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-500 border-b border-charcoal-100 pb-2">
            2. Location & Coordinates
          </h3>

          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
            address={address}
            onAddressChange={setAddress}
            locality={locality}
            onLocalityChange={setLocality}
          />
        </div>

        {/* Section 3: Before-Cleaning Photograph */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-500 border-b border-charcoal-100 pb-2">
            3. Photographic Evidence (Before Cleanup)
          </h3>

          {!photoPreview ? (
            <div className="border-2 border-dashed border-charcoal-200 hover:border-forest-600 rounded-2xl p-6 text-center transition bg-charcoal-50/50">
              <Camera className="w-10 h-10 text-charcoal-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-charcoal-800">
                Click to upload or drag and drop photo
              </p>
              <p className="text-[11px] text-charcoal-500 mt-0.5">
                JPEG, PNG, or WebP up to 10MB. Clear photo of the waste helps verify urgency.
              </p>
              <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-forest-800 text-white hover:bg-forest-900 cursor-pointer shadow-soft-sm transition">
                <Upload className="w-3.5 h-3.5" />
                Select Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-charcoal-200 bg-charcoal-100 max-w-md mx-auto aspect-[4/3]">
              <img
                src={photoPreview}
                alt="Selected evidence preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-charcoal-900/80 hover:bg-charcoal-900 text-white transition shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/60 text-white text-[11px] font-medium backdrop-blur-sm">
                Evidence preview ready for upload
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-charcoal-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-charcoal-200 text-charcoal-700 font-semibold text-xs text-center hover:bg-charcoal-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-soft transition disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? 'Submitting Report...' : 'Submit Waste Report'}
          </button>
        </div>
      </form>
    </div>
  );
};
