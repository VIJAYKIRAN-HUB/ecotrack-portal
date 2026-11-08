import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Complaint } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { PriorityBadge } from '../../components/common/PriorityBadge.js';
import { HardHat, MapPin, Camera, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AssignedTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkerTasks()
      .then((res) => {
        if (res.success && res.tasks) {
          setTasks(res.tasks);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
          <HardHat className="w-6 h-6 text-amber-600" />
          Assigned Field Tasks
        </h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Active waste collection jobs dispatched to you by municipal administrators.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-charcoal-200 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-800 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-charcoal-500">Loading assigned tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-charcoal-900">Queue is clear!</h4>
            <p className="text-xs text-charcoal-500 mt-1">
              You have no active waste collection assignments pending.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-charcoal-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-5 sm:p-6 hover:bg-charcoal-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  {task.before_image_url ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-charcoal-100 shrink-0 border border-charcoal-200">
                      <img
                        src={task.before_image_url}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-charcoal-100 flex items-center justify-center shrink-0 text-charcoal-400">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-forest-800">
                        {task.public_complaint_id}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                    <h3 className="text-base font-bold text-charcoal-900 truncate">{task.title}</h3>
                    <p className="text-xs text-charcoal-600 line-clamp-1 mt-0.5">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                      <span>{task.address}, {task.locality}</span>
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <Link
                    to={`/worker/tasks/${task.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-soft transition"
                  >
                    Resolve Task
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
