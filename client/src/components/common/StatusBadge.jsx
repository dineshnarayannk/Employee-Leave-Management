import React from 'react';
import { Clock, CheckCircle2, XCircle, Ban, Check, ShieldAlert } from 'lucide-react';

export default function StatusBadge({ status, size = 'sm', className = '' }) {
  const normStatus = (status || '').toUpperCase();

  const configs = {
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      icon: Clock,
      dot: 'bg-amber-400',
    },
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      icon: CheckCircle2,
      dot: 'bg-emerald-400',
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      icon: XCircle,
      dot: 'bg-rose-400',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      icon: Ban,
      dot: 'bg-slate-400',
    },
    ACTIVE: {
      label: 'Active',
      bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      icon: Check,
      dot: 'bg-emerald-400',
    },
    INACTIVE: {
      label: 'Inactive',
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      icon: Ban,
      dot: 'bg-slate-500',
    },
  };

  const current = configs[normStatus] || {
    label: status || 'Unknown',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: ShieldAlert,
    dot: 'bg-slate-400',
  };

  const Icon = current.icon;
  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const iconSizes = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${current.bg} ${sizeClasses} ${className}`}
    >
      <Icon className={`${iconSizes} flex-shrink-0`} aria-hidden="true" />
      <span>{current.label}</span>
    </span>
  );
}
