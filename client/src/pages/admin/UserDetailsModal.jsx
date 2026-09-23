import React from 'react';
import { X, User, Mail, Building2, ShieldCheck, UserCheck, Calendar, CheckCircle2, XCircle, KeyRound } from 'lucide-react';

export default function UserDetailsModal({ isOpen, user, onClose }) {
  if (!isOpen || !user) return null;

  const roleColors = {
    1: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    2: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    3: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{user.name}</h2>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${roleColors[user.role_id] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {user.role_name || `role_id: ${user.role_id}`}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
            <p className="text-slate-500 font-medium flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-indigo-400" /> Department</p>
            <p className="text-slate-200 font-semibold">{user.department || 'Not assigned'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
            <p className="text-slate-500 font-medium flex items-center gap-1.5">
              {user.is_active ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
              Account Status
            </p>
            <p className={`font-semibold ${user.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>
              {user.is_active ? 'Active' : 'Inactive (Deactivated)'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1 sm:col-span-2">
            <p className="text-slate-500 font-medium flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-blue-400" /> Reporting Manager</p>
            <p className="text-slate-200 font-semibold">
              {user.manager_name ? `${user.manager_name} (${user.manager_email || 'Assigned'})` : user.role_id === 2 ? 'None (Manager Role)' : 'No Manager Assigned'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
            <p className="text-slate-500 font-medium flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-violet-400" /> Google OAuth ID</p>
            <p className="text-slate-200 font-mono text-[11px] truncate">
              {user.google_id ? `Linked (${user.google_id})` : 'Pending First Login'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
            <p className="text-slate-500 font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-400" /> Registration Date</p>
            <p className="text-slate-200 font-mono text-[11px]">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
