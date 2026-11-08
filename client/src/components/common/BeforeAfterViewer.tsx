import React, { useState } from 'react';
import { Camera, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { ComplaintImage } from '../../types/index.js';
import { getAssetUrl } from '../../services/api.js';

interface BeforeAfterViewerProps {
  images?: ComplaintImage[];
  resolvedAt?: string | null;
  resolutionNote?: string | null;
}

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({
  images = [],
  resolvedAt,
  resolutionNote,
}) => {
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'before' | 'after'>('side-by-side');

  const beforeImage = images.find((img) => img.image_type === 'before');
  const afterImage = images.find((img) => img.image_type === 'after');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-charcoal-200/80 p-5 shadow-soft">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-charcoal-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-forest-600" />
            Visual Evidence: Before & After Cleanup
          </h3>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Photographic proof verified by municipal sanitation supervisors
          </p>
        </div>

        {/* View toggle */}
        <div className="inline-flex p-1 bg-charcoal-100 rounded-lg text-xs font-medium self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setActiveTab('side-by-side')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'side-by-side' ? 'bg-white text-forest-900 shadow-sm' : 'text-charcoal-600'
            }`}
          >
            Side by Side
          </button>
          <button
            onClick={() => setActiveTab('before')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'before' ? 'bg-white text-forest-900 shadow-sm' : 'text-charcoal-600'
            }`}
          >
            Before
          </button>
          <button
            onClick={() => setActiveTab('after')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'after' ? 'bg-white text-forest-900 shadow-sm' : 'text-charcoal-600'
            }`}
          >
            After
          </button>
        </div>
      </div>

      {/* Side-by-Side or Selected View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BEFORE PHOTO */}
        {(activeTab === 'side-by-side' || activeTab === 'before') && (
          <div className="flex flex-col rounded-xl overflow-hidden border border-charcoal-200 bg-charcoal-50">
            <div className="px-3.5 py-2 bg-charcoal-100/80 border-b border-charcoal-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-charcoal-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Original Report (Before)
              </span>
              {beforeImage && (
                <span className="text-charcoal-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(beforeImage.created_at)}
                </span>
              )}
            </div>

            <div className="relative aspect-[4/3] bg-charcoal-100 flex items-center justify-center overflow-hidden">
              {beforeImage ? (
                <img
                  src={getAssetUrl(beforeImage.image_url)}
                  alt="Before cleanup evidence"
                  className="w-full h-full object-cover transition-all hover:scale-105 duration-300"
                />
              ) : (
                <div className="text-center p-6 text-charcoal-400">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">No initial photograph uploaded</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AFTER PHOTO */}
        {(activeTab === 'side-by-side' || activeTab === 'after') && (
          <div className="flex flex-col rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50/30">
            <div className="px-3.5 py-2 bg-emerald-100/70 border-b border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Resolved Site (After)
              </span>
              {afterImage ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {formatDate(afterImage.created_at)}
                </span>
              ) : resolvedAt ? (
                <span className="text-emerald-700">{formatDate(resolvedAt)}</span>
              ) : null}
            </div>

            <div className="relative aspect-[4/3] bg-emerald-50/50 flex items-center justify-center overflow-hidden">
              {afterImage ? (
                <img
                  src={getAssetUrl(afterImage.image_url)}
                  alt="After cleanup verified evidence"
                  className="w-full h-full object-cover transition-all hover:scale-105 duration-300"
                />
              ) : (
                <div className="text-center p-6 text-charcoal-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
                  <p className="text-xs font-medium text-charcoal-600">
                    {resolvedAt ? 'Marked resolved without photograph' : 'Resolution in progress'}
                  </p>
                  <p className="text-[11px] text-charcoal-400 mt-0.5">
                    {resolvedAt
                      ? 'No resolution photo provided by worker'
                      : 'After-cleaning photo will appear once worker resolves the task'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resolution Notes Box if present */}
      {resolutionNote && (
        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl">
          <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Sanitation Officer Resolution Note
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">{resolutionNote}</p>
        </div>
      )}
    </div>
  );
};
