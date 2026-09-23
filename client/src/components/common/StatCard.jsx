import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  className = '',
}) {
  const colorMap = {
    indigo: {
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      border: 'border-slate-800 hover:border-indigo-500/30',
      glow: 'from-indigo-500/5',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      border: 'border-slate-800 hover:border-amber-500/30',
      glow: 'from-amber-500/5',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      border: 'border-slate-800 hover:border-emerald-500/30',
      glow: 'from-emerald-500/5',
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      border: 'border-slate-800 hover:border-rose-500/30',
      glow: 'from-rose-500/5',
    },
    purple: {
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      border: 'border-slate-800 hover:border-purple-500/30',
      glow: 'from-purple-500/5',
    },
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      border: 'border-slate-800 hover:border-blue-500/30',
      glow: 'from-blue-500/5',
    },
    slate: {
      iconBg: 'bg-slate-800 text-slate-400 border-slate-700',
      border: 'border-slate-800 hover:border-slate-700',
      glow: 'from-slate-500/5',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-slate-900/80 border p-5 sm:p-6 shadow-sm transition-all duration-200 hover:shadow-md ${scheme.border} ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${scheme.glow} to-transparent pointer-events-none opacity-50`}></div>
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-400 block tracking-wide uppercase">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {value !== undefined && value !== null ? value : '-'}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className="text-[11px] font-medium text-slate-400 pt-0.5">{trend}</div>
          )}
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border flex-shrink-0 shadow-sm ${scheme.iconBg}`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
