import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-indigo-400',
  backLink,
  backText = 'Back',
  actions,
  children,
  badge,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-850/60">
      <div className="space-y-1">
        {backLink ? (
          typeof backLink === 'string' ? (
            <Link
              to={backLink}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition mb-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{backText}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition mb-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{backText}</span>
            </button>
          )
        ) : null}

        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
              {badge && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {(actions || children) && (
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
