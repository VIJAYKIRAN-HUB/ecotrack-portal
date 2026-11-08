import React from 'react';
import { ComplaintStatus } from '../../types/index.js';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = (s: string) => {
    switch (s) {
      case 'Submitted':
        return 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/20';
      case 'Verified':
        return 'bg-blue-50 text-blue-800 border-blue-200 ring-blue-600/20';
      case 'Assigned':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 ring-indigo-600/20';
      case 'In Progress':
        return 'bg-purple-50 text-purple-800 border-purple-200 ring-purple-600/20';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-600/20';
      case 'Reopened':
        return 'bg-orange-50 text-orange-800 border-orange-200 ring-orange-600/20';
      case 'Rejected':
        return 'bg-red-50 text-red-800 border-red-200 ring-red-600/20';
      case 'Withdrawn':
        return 'bg-charcoal-100 text-charcoal-700 border-charcoal-200 ring-charcoal-600/20';
      default:
        return 'bg-charcoal-50 text-charcoal-700 border-charcoal-200 ring-charcoal-600/20';
    }
  };

  const getDotColor = (s: string) => {
    switch (s) {
      case 'Submitted':
        return 'bg-amber-500';
      case 'Verified':
        return 'bg-blue-500';
      case 'Assigned':
        return 'bg-indigo-500';
      case 'In Progress':
        return 'bg-purple-500 animate-pulse';
      case 'Resolved':
        return 'bg-emerald-500';
      case 'Reopened':
        return 'bg-orange-500';
      case 'Rejected':
        return 'bg-red-500';
      case 'Withdrawn':
        return 'bg-charcoal-400';
      default:
        return 'bg-charcoal-400';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-soft-sm ${sizeClasses[size]} ${getStyles(
        status
      )}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(status)}`} />
      {status}
    </span>
  );
};
