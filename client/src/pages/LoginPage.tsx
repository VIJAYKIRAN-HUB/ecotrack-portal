import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { LogIn, Eye, EyeOff, Shield, User, HardHat, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const loggedInUser = await login({ email, password });
      success(`Welcome back, ${loggedInUser.name}!`);

      if (from) {
        navigate(from, { replace: true });
      } else if (loggedInUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (loggedInUser.role === 'worker') {
        navigate('/worker', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'citizen' | 'worker') => {
    if (role === 'admin') {
      setEmail('admin@ecotrack.gov');
      setPassword('Admin@123');
    } else if (role === 'citizen') {
      setEmail('citizen@example.com');
      setPassword('Citizen@123');
    } else if (role === 'worker') {
      setEmail('worker@ecotrack.gov');
      setPassword('Worker@123');
    }
  };

  return (
    <div className="min-h-screen bg-surface-warm flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-forest-900 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-forest-800 text-white flex items-center justify-center text-xl shadow-soft">
            🌿
          </div>
          <span className="text-2xl font-extrabold tracking-tight">EcoTrack</span>
        </Link>
        <h2 className="text-xl font-bold text-charcoal-900">Sign in to your portal</h2>
        <p className="text-xs text-charcoal-500 mt-1">
          Access citizen reporting, municipal management, or sanitation tasks
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-soft-xl border border-charcoal-200">
          {/* Quick Demo Fill Buttons */}
          <div className="mb-6 pb-6 border-b border-charcoal-100">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-400 mb-2">
              ⚡ Quick Demo Login (Select Role)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('citizen')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 transition text-center"
              >
                <User className="w-4 h-4 text-emerald-700 mb-1" />
                <span className="text-[11px] font-bold">Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-forest-200 bg-forest-50/60 hover:bg-forest-100/70 text-forest-900 transition text-center"
              >
                <Shield className="w-4 h-4 text-forest-700 mb-1" />
                <span className="text-[11px] font-bold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('worker')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 transition text-center"
              >
                <HardHat className="w-4 h-4 text-amber-700 mb-1" />
                <span className="text-[11px] font-bold">Worker</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-charcoal-200 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-charcoal-400 hover:text-charcoal-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-forest-800 text-white hover:bg-forest-900 shadow-soft transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-charcoal-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-forest-700 hover:text-forest-900">
              Create citizen account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
