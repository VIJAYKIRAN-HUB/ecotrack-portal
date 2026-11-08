import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Complaint, ComplaintStatus } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import { BeforeAfterViewer } from '../../components/common/BeforeAfterViewer.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Shield,
  HardHat,
  RotateCcw,
  Edit2,
  Trash2,
  CheckCircle2,
  Send,
  AlertTriangle,
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

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [reopenNote, setReopenNote] = useState('');
  const [reopening, setReopening] = useState(false);

  // Admin Quick Actions
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [workersList, setWorkersList] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchComplaint = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getComplaint(id);
      if (res.success && res.complaint) {
        setComplaint(res.complaint);
      }
    } catch (err: any) {
      error(err.message || 'Complaint not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleWithdraw = async () => {
    if (!complaint) return;
    try {
      await api.deleteComplaint(complaint.id, 'Withdrawn by citizen');
      success('Complaint successfully withdrawn.');
      setIsWithdrawOpen(false);
      fetchComplaint();
    } catch (err: any) {
      error(err.message || 'Failed to withdraw complaint');
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !reopenNote.trim()) {
      error('Please provide a note explaining why this issue is being reopened.');
      return;
    }

    setReopening(true);
    try {
      await api.reopenComplaint(complaint.id, reopenNote);
      success('Complaint reopened. Municipal administrators have been notified.');
      setIsReopenOpen(false);
      setReopenNote('');
      fetchComplaint();
    } catch (err: any) {
      error(err.message || 'Failed to reopen complaint');
    } finally {
      setReopening(false);
    }
  };

  const handleVerify = async () => {
    if (!complaint) return;
    try {
      await api.updateStatus(complaint.id, 'Verified', 'Verified by municipal administrator');
      success('Complaint marked as Verified.');
      fetchComplaint();
    } catch (err: any) {
      error(err.message || 'Verification failed');
    }
  };

  const openAssignModal = async () => {
    try {
      const res = await api.getAdminWorkers();
      if (res.success && res.workers) {
        setWorkersList(res.workers);
        if (res.workers.length > 0) {
          setSelectedWorkerId(res.workers[0].id);
        }
      }
      setIsAssignOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to load workers');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !selectedWorkerId) return;

    setAssigning(true);
    try {
      await api.assignWorker(complaint.id, Number(selectedWorkerId), assignNotes);
      success('Sanitation worker assigned successfully.');
      setIsAssignOpen(false);
      fetchComplaint();
    } catch (err: any) {
      error(err.message || 'Failed to assign worker');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-charcoal-500">Loading complaint details...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="p-12 text-center max-w-sm mx-auto">
        <h3 className="text-base font-bold text-charcoal-900 mb-2">Complaint Not Found</h3>
        <p className="text-xs text-charcoal-500 mb-4">
          The requested complaint does not exist or may have been deleted.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-forest-800 text-white"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Lifecycle progress steps
  const workflowSteps: ComplaintStatus[] = ['Submitted', 'Verified', 'Assigned', 'In Progress', 'Resolved'];
  const currentStepIdx = workflowSteps.indexOf(complaint.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-charcoal-800 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-charcoal-950 font-mono tracking-tight">
              {complaint.public_complaint_id}
            </h2>
            <StatusBadge status={complaint.status} size="lg" />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        {/* Action Controls based on User Role */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Citizen Actions */}
          {user?.role === 'citizen' && complaint.citizen_id === user.id && (
            <>
              {complaint.status === 'Submitted' && (
                <Link
                  to={`/complaints/${complaint.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-charcoal-300 bg-white hover:bg-charcoal-50 text-xs font-semibold text-charcoal-800 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Report
                </Link>
              )}

              {complaint.status !== 'Resolved' && complaint.status !== 'Withdrawn' && (
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Withdraw
                </button>
              )}

              {complaint.status === 'Resolved' && (
                <button
                  type="button"
                  onClick={() => setIsReopenOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-orange-300 bg-orange-50 hover:bg-orange-100 text-xs font-semibold text-orange-900 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reopen Issue
                </button>
              )}
            </>
          )}

          {/* Admin Actions */}
          {user?.role === 'admin' && (
            <>
              {complaint.status === 'Submitted' && (
                <button
                  type="button"
                  onClick={handleVerify}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-soft-sm transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verify Report
                </button>
              )}

              {['Submitted', 'Verified', 'Reopened'].includes(complaint.status) && (
                <button
                  type="button"
                  onClick={openAssignModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold shadow-soft-sm transition"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  Assign Worker
                </button>
              )}
            </>
          )}

          {/* Worker Actions */}
          {user?.role === 'worker' && complaint.assigned_worker_id === user.id && (
            <Link
              to={`/worker/tasks/${complaint.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold shadow-soft transition"
            >
              Open Worker Action Sheet →
            </Link>
          )}
        </div>
      </div>

      {/* Progress Workflow Stepper */}
      {complaint.status !== 'Rejected' && complaint.status !== 'Withdrawn' && (
        <div className="bg-white rounded-2xl p-5 border border-charcoal-200 shadow-soft">
          <div className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400 mb-4">
            Cleanup Lifecycle Progress
          </div>
          <div className="relative flex items-center justify-between">
            {workflowSteps.map((step, idx) => {
              const isCompleted = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div key={step} className="flex-1 flex flex-col items-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                      isCompleted
                        ? 'bg-forest-800 text-white shadow-soft-sm'
                        : 'bg-charcoal-100 text-charcoal-400'
                    } ${isCurrent ? 'ring-4 ring-forest-500/20' : ''}`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-semibold text-center ${
                      isCompleted ? 'text-forest-900' : 'text-charcoal-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}

            {/* Connecting line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-charcoal-200 -z-0" />
            <div
              className="absolute top-4 left-6 h-0.5 bg-forest-800 transition-all duration-500 -z-0"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (currentStepIdx / (workflowSteps.length - 1)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Before and After Visual Evidence Component */}
      <BeforeAfterViewer
        images={complaint.images}
        resolvedAt={complaint.resolved_at}
        resolutionNote={complaint.resolution_note}
      />

      {/* Complaint Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            {complaint.category}
          </span>
          <h3 className="text-xl font-extrabold text-charcoal-900 mt-2.5">{complaint.title}</h3>
          <p className="text-sm text-charcoal-700 mt-2 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </p>
        </div>

        {/* Location & Metadata Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-charcoal-100">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
              Location Details
            </div>
            <div className="flex items-start gap-2 text-xs text-charcoal-700">
              <MapPin className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-charcoal-900">{complaint.locality}</span>
                <span className="text-charcoal-600">{complaint.address}</span>
              </div>
            </div>

            {complaint.latitude && complaint.longitude && (
              <div className="text-[11px] font-mono text-charcoal-500 pl-6">
                GPS: {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
              Administration & Assignment
            </div>
            <div className="flex items-center gap-2 text-xs text-charcoal-700">
              <User className="w-4 h-4 text-charcoal-400 shrink-0" />
              <span>
                Reported by <strong className="text-charcoal-900">{complaint.citizen_name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-charcoal-700">
              <HardHat className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Assigned Worker:{' '}
                <strong className="text-charcoal-900">
                  {complaint.assigned_worker_name || 'Awaiting assignment'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-charcoal-500">
              <Calendar className="w-4 h-4 text-charcoal-400 shrink-0" />
              <span>
                Logged on {new Date(complaint.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Mini Location Map */}
        {complaint.latitude && complaint.longitude && (
          <div className="pt-2">
            <div className="h-48 rounded-2xl overflow-hidden border border-charcoal-200">
              <MapContainer
                center={[complaint.latitude, complaint.longitude]}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[complaint.latitude, complaint.longitude]} icon={customIcon}>
                  <Popup>{complaint.address}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}
      </div>

      {/* Visual Timeline / Status Change Audit Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-charcoal-200 shadow-soft">
        <h3 className="text-base font-bold text-charcoal-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-forest-700" />
          Audit Trail & Status Timeline
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-charcoal-200">
          {complaint.status_history?.map((hist, idx) => (
            <div key={hist.id || idx} className="relative">
              {/* Dot */}
              <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-forest-700 shadow-sm" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-charcoal-900">
                  Status changed to <StatusBadge status={hist.new_status} size="sm" />
                </span>
                <span className="text-[11px] text-charcoal-400">
                  {new Date(hist.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-charcoal-600 mt-1">
                {hist.note || 'Status updated'}
              </p>
              <div className="text-[10px] text-charcoal-400 mt-0.5">
                Acting User: {hist.changed_by_name} ({hist.changed_by_role})
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reopen Modal Dialog */}
      {isReopenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft-xl border border-charcoal-200">
            <h3 className="text-base font-bold text-charcoal-900 mb-2">Reopen Complaint</h3>
            <p className="text-xs text-charcoal-600 mb-4">
              If the waste has not been fully cleared or has re-accumulated, explain the issue below.
            </p>
            <form onSubmit={handleReopen}>
              <textarea
                required
                rows={3}
                value={reopenNote}
                onChange={(e) => setReopenNote(e.target.value)}
                placeholder="e.g. Only half of the waste pile was taken away, large plastic debris remains on sidewalk..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-300 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-700 mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReopenOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 bg-charcoal-100 hover:bg-charcoal-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopening}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-sm transition"
                >
                  {reopening ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Worker Modal (Admin) */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft-xl border border-charcoal-200">
            <h3 className="text-base font-bold text-charcoal-900 mb-2">Assign Sanitation Worker</h3>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Select Sanitation Officer
                </label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-300 bg-white"
                >
                  {workersList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.activeTasks} active tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Assignment Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Deploy 1.5-ton compactor truck"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-charcoal-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 bg-charcoal-100 hover:bg-charcoal-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-forest-800 hover:bg-forest-900 shadow-sm transition"
                >
                  {assigning ? 'Assigning...' : 'Dispatch Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isWithdrawOpen}
        title="Withdraw Complaint"
        message="Are you sure you want to withdraw this complaint? It will be marked as withdrawn in municipal records."
        confirmLabel="Yes, Withdraw"
        isDestructive={true}
        onConfirm={handleWithdraw}
        onCancel={() => setIsWithdrawOpen(false)}
      />
    </div>
  );
};
