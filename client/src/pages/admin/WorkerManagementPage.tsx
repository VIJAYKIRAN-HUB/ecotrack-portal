import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { WorkerWorkload } from '../../types/index.js';
import {
  Users,
  UserPlus,
  HardHat,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Power,
  Search,
} from 'lucide-react';

export const WorkerManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const [workers, setWorkers] = useState<WorkerWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  // New Worker Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminWorkers();
      if (res.success && res.workers) {
        setWorkers(res.workers);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      error('Name, email, and password are required.');
      return;
    }

    setCreating(true);
    try {
      await api.createWorker({ name, email, password, phone, role: 'worker' });
      success(`Sanitation worker ${name} created successfully.`);
      setIsAddOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      fetchWorkers();
    } catch (err: any) {
      error(err.message || 'Failed to create worker account');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (workerId: number, currentActive: boolean) => {
    try {
      await api.updateWorkerStatus(workerId, !currentActive);
      success(`Worker account ${!currentActive ? 'activated' : 'deactivated'}.`);
      fetchWorkers();
    } catch (err: any) {
      error(err.message || 'Failed to update account status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-forest-700" />
            Sanitation Workforce Management
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Oversee sanitation staff, monitor task queues, and provision officer accounts.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-soft transition"
        >
          <UserPlus className="w-4 h-4" />
          Add Sanitation Worker
        </button>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 p-16 text-center">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Loading worker directory...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="col-span-3 p-12 text-center bg-white rounded-3xl border border-charcoal-200">
            <HardHat className="w-10 h-10 text-charcoal-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-charcoal-800">No workers registered yet</p>
          </div>
        ) : (
          workers.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-3xl p-6 border border-charcoal-200 shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm shadow-soft-sm">
                    👷
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-forest-100 text-forest-800">
                    Active Officer
                  </span>
                </div>

                <h3 className="text-base font-bold text-charcoal-900">{w.name}</h3>

                <div className="space-y-1.5 text-xs text-charcoal-500 mt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                    <span className="truncate">{w.email}</span>
                  </div>
                  {w.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                      <span>{w.phone}</span>
                    </div>
                  )}
                </div>

                {/* Performance stats */}
                <div className="grid grid-cols-2 gap-2 mt-5 p-3 rounded-2xl bg-charcoal-50 text-center">
                  <div>
                    <div className="text-lg font-extrabold text-amber-700">{w.activeTasks}</div>
                    <div className="text-[10px] text-charcoal-500 uppercase font-semibold">
                      Active Tasks
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-emerald-700">
                      {w.completedTasks}
                    </div>
                    <div className="text-[10px] text-charcoal-500 uppercase font-semibold">
                      Resolved
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-charcoal-100 flex items-center justify-between text-xs text-charcoal-500">
                <span>Avg Resolution: {w.avgResolutionHours}h</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Worker Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-soft-xl border border-charcoal-200">
            <h3 className="text-lg font-bold text-charcoal-900 mb-1">
              Register Sanitation Worker
            </h3>
            <p className="text-xs text-charcoal-500 mb-5">
              Create credentials for field officers to receive and resolve assigned tasks.
            </p>

            <form onSubmit={handleCreateWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-charcoal-200 focus:outline-none focus:border-forest-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="worker@ecotrack.gov"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-charcoal-200 focus:outline-none focus:border-forest-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Initial Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-charcoal-200 focus:outline-none focus:border-forest-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 94481 22334"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-charcoal-200 focus:outline-none focus:border-forest-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 bg-charcoal-100 hover:bg-charcoal-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-forest-800 hover:bg-forest-900 shadow-soft transition disabled:opacity-50"
                >
                  {creating ? 'Creating Account...' : 'Create Worker Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
