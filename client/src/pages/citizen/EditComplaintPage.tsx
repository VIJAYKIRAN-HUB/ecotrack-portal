import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LocationPicker } from '../../components/map/LocationPicker.js';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { WasteCategory } from '../../types/index.js';

export const EditComplaintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WasteCategory>('Garbage Accumulation');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getComplaint(id)
      .then((res) => {
        if (res.success && res.complaint) {
          const c = res.complaint;
          if (c.status !== 'Submitted') {
            error('Only complaints in "Submitted" status can be edited.');
            navigate(`/complaints/${c.id}`);
            return;
          }
          setTitle(c.title);
          setDescription(c.description);
          setCategory(c.category);
          setAddress(c.address);
          setLocality(c.locality);
          setLatitude(c.latitude);
          setLongitude(c.longitude);
        }
      })
      .catch((err) => {
        error(err.message || 'Failed to load complaint');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      await api.editComplaint(Number(id), {
        title,
        description,
        category,
        address,
        locality,
        latitude,
        longitude,
      });
      success('Complaint updated successfully.');
      navigate(`/complaints/${id}`);
    } catch (err: any) {
      error(err.message || 'Failed to update complaint');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-charcoal-500">Loading complaint details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-charcoal-800 mb-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Cancel Editing
        </button>
        <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">Edit Complaint</h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Update the location or description before municipal verification begins.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft space-y-6">
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
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700"
          />
        </div>

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
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700"
          />
        </div>

        <div className="pt-2">
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

        <div className="pt-4 border-t border-charcoal-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-charcoal-200 text-charcoal-700 font-semibold text-xs hover:bg-charcoal-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-soft transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
