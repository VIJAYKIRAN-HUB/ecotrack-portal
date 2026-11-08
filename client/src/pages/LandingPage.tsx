import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  Sparkles,
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Trash2,
  Users,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Fetch live impact numbers if available
    api.getAdminOverview()
      .then((res) => {
        if (res.success && res.metrics) {
          setStats(res.metrics);
        }
      })
      .catch(() => {
        // Fallback default numbers if unauthenticated
        setStats({
          totalValidComplaints: 9,
          resolvedComplaints: 2,
          resolutionRate: 75.0,
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-surface-warm flex flex-col font-sans selection:bg-forest-100 selection:text-forest-900">
      {/* Top Navigation */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-charcoal-200/80 sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-forest-800 text-white flex items-center justify-center text-xl shadow-soft">
            🌿
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight text-forest-950">EcoTrack</div>
            <div className="text-[11px] font-semibold text-emerald-600 tracking-wide uppercase">
              Cleaner Streets. Smarter Cities.
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : user.role === 'worker' ? '/worker' : '/dashboard'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-forest-800 text-white hover:bg-forest-900 shadow-soft transition"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-charcoal-700 hover:text-forest-800 px-3 py-2 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-forest-800 text-white hover:bg-forest-900 shadow-soft transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 sm:px-12 pt-16 pb-20 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold mb-6 shadow-soft-sm">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            Smart India Hackathon 2025 · Clean & Green Tech (SIH25060)
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal-950 tracking-tight leading-[1.15] mb-6">
            Cleaner Streets <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-forest-800 via-forest-600 to-emerald-600">
              Start With You.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
            A citizen-first waste management portal connecting residents, municipal administrators,
            and sanitation crews. Report overflowing dustbins, track rapid cleanups, and verify
            neighbourhood cleanliness with photographic evidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
            <Link
              to="/report"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-forest-800 text-white hover:bg-forest-900 shadow-soft-lg hover:shadow-soft-xl transition"
            >
              <Trash2 className="w-4 h-4" />
              Report Waste Now
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-white border border-charcoal-300 text-charcoal-800 hover:bg-charcoal-50 shadow-soft-sm transition"
            >
              Explore Live Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none">
          <div className="relative rounded-3xl bg-white p-6 shadow-soft-xl border border-charcoal-200/90 overflow-hidden">
            {/* Visual Header */}
            <div className="flex items-center justify-between pb-4 border-b border-charcoal-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono font-semibold text-charcoal-500 ml-2">
                  ECO-2026-00001
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Resolved & Verified
              </span>
            </div>

            {/* Simulated Report Card */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-charcoal-50 p-4 border border-charcoal-200">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-sm font-bold text-charcoal-900">
                    Garbage accumulation near Metro Station Gate B
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 shrink-0">
                    Urgent
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                  <span>100 Feet Rd, Indiranagar · GPS: 12.9784, 77.6408</span>
                </div>

                {/* Before & After Preview */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl overflow-hidden border border-red-200 bg-red-50 p-2 text-center">
                    <span className="text-[10px] font-bold text-red-700 block mb-1">BEFORE</span>
                    <div className="aspect-[4/3] rounded-lg bg-red-100/60 flex items-center justify-center text-xs text-red-800 font-medium">
                      📸 1.2 Tons Waste
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 p-2 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 block mb-1">AFTER</span>
                    <div className="aspect-[4/3] rounded-lg bg-emerald-100/60 flex items-center justify-center text-xs text-emerald-800 font-medium">
                      ✨ Sanitized Clean
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-forest-50/80 border border-forest-200/80 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
                  <span className="font-semibold text-forest-900">
                    Sanitation Officer Ramesh Kumar
                  </span>
                </div>
                <span className="text-forest-700 font-medium">Resolution Time: 3.4 hrs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Impact Statistics */}
      {stats && (
        <section className="bg-white border-y border-charcoal-200/80 py-12 px-6 sm:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-forest-900 mb-1">
                {stats.totalValidComplaints || '100%'}
              </div>
              <div className="text-xs font-semibold text-charcoal-600">Total Valid Reports</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mb-1">
                {stats.resolvedComplaints || '12'}
              </div>
              <div className="text-xs font-semibold text-charcoal-600">Neighborhoods Cleaned</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-forest-700 mb-1">
                {stats.resolutionRate}%
              </div>
              <div className="text-xs font-semibold text-charcoal-600">Resolution Rate</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 mb-1">
                &lt; 24h
              </div>
              <div className="text-xs font-semibold text-charcoal-600">Target Response Window</div>
            </div>
          </div>
        </section>
      )}

      {/* 3-Step "How It Works" Section */}
      <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-emerald-700 mb-2">
            Seamless Workflow
          </h2>
          <h3 className="text-3xl font-extrabold text-charcoal-950">
            How EcoTrack Cleans Our Cities
          </h3>
          <p className="text-sm text-charcoal-600 mt-3">
            A transparent, audit-ready closed loop from initial citizen observation to verified resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 border border-charcoal-200 shadow-soft flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-lg mb-6">
                1
              </div>
              <h4 className="text-lg font-bold text-charcoal-900 mb-2.5">Snap & Geo-Report</h4>
              <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                Take a photo of the accumulated waste, select the waste category, and pinpoint the exact coordinates via GPS or interactive map.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-charcoal-100 flex items-center gap-2 text-xs font-semibold text-forest-700">
              <Camera className="w-4 h-4" /> Before photo evidence
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 border border-charcoal-200 shadow-soft flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-lg mb-6">
                2
              </div>
              <h4 className="text-lg font-bold text-charcoal-900 mb-2.5">
                AI Duplicate Check & Dispatch
              </h4>
              <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                Our rule-based engine flags duplicate reports automatically. Municipal admins verify the complaint and dispatch sanitation teams.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-charcoal-100 flex items-center gap-2 text-xs font-semibold text-forest-700">
              <Users className="w-4 h-4" /> Real-time crew dispatch
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 border border-charcoal-200 shadow-soft flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-lg mb-6">
                3
              </div>
              <h4 className="text-lg font-bold text-charcoal-900 mb-2.5">Clean & Verified</h4>
              <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                Sanitation workers clean the area and upload an after-cleaning photo with notes. Citizens receive instant notification of the resolution.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-charcoal-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Verified clean streets
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-charcoal-950 text-white border-t border-charcoal-900 py-12 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold text-base">
              🌿
            </div>
            <div>
              <div className="font-bold text-base">EcoTrack</div>
              <div className="text-[11px] text-charcoal-400">
                SIH 2025 Inspiration · SIH25060 · Clean & Green Technology
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-charcoal-400">
            <Link to="/login" className="hover:text-white transition">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-white transition">
              Citizen Registration
            </Link>
            <span className="text-charcoal-600">·</span>
            <span>Localhost Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
