import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Building2, 
  CheckCircle2, 
  Activity, 
  Server, 
  Layers, 
  Database,
  KeyRound,
  FileCode2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { checkBackendHealth, checkDbHealth } from '../services/api';

export default function LandingPage() {
  const [apiHealth, setApiHealth] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const [dbHealth, setDbHealth] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const runHealthChecks = async () => {
    // Check API Server
    setApiHealth({ loading: true, data: null, error: null });
    try {
      const res = await checkBackendHealth();
      setApiHealth({ loading: false, data: res, error: null });
    } catch (err) {
      setApiHealth({ 
        loading: false, 
        data: null, 
        error: err.message || 'Unable to connect to backend server' 
      });
    }

    // Check TiDB Database
    setDbHealth({ loading: true, data: null, error: null });
    try {
      const res = await checkDbHealth();
      setDbHealth({ loading: false, data: res, error: null });
    } catch (err) {
      setDbHealth({ 
        loading: false, 
        data: err.data || null, 
        error: err.data?.message || err.message || 'TiDB Cloud connection unconfigured or offline' 
      });
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const roles = [
    {
      id: 1,
      title: 'Admin Portal',
      badge: 'role_id: 1',
      description: 'System-wide governance, department management, leave policies, and organizational analytics.',
      icon: ShieldCheck,
      color: 'from-purple-500 to-indigo-600',
      border: 'border-purple-500/20',
      bgBadge: 'bg-purple-500/10 text-purple-400',
    },
    {
      id: 2,
      title: 'Manager Portal',
      badge: 'role_id: 2',
      description: 'Team leave approvals, direct report balances, calendar visibility, and leave trend reviews.',
      icon: UserCheck,
      color: 'from-blue-500 to-cyan-600',
      border: 'border-blue-500/20',
      bgBadge: 'bg-blue-500/10 text-blue-400',
    },
    {
      id: 3,
      title: 'Employee Portal',
      badge: 'role_id: 3',
      description: 'Apply for leaves, track approval statuses, view remaining balances, and check holiday calendars.',
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      border: 'border-emerald-500/20',
      bgBadge: 'bg-emerald-500/10 text-emerald-400',
    },
  ];

  const milestones = [
    { name: 'Step 1: Project & Environment Setup', status: 'completed', desc: 'React + Vite + Tailwind + Express initialized' },
    { name: 'Step 2: TiDB Database Schema & Connection Pool', status: 'completed', desc: 'MySQL tables, seed data, and connection pool ready' },
    { name: 'Step 3: Google OAuth & RBAC Auth', status: 'pending', desc: 'Google login flow with role-based routing' },
    { name: 'Step 4: Portals & Leave Management Engine', status: 'pending', desc: 'Admin, Manager, & Employee workflows' },
  ];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" /> Phase 2 Foundation Ready
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Employee Leave <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Management System
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Modern, role-aware leave workflow platform built for enterprises with TiDB Cloud MySQL database and Express.js REST API.
        </p>
      </div>

      {/* Dual Health Check Cards (API + Database) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
        {/* API Health Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Express API Server</h2>
                  <p className="text-xs text-slate-400 font-mono">GET /api/health</p>
                </div>
              </div>
              <button
                onClick={runHealthChecks}
                disabled={apiHealth.loading || dbHealth.loading}
                className="p-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
                title="Refresh Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${apiHealth.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {apiHealth.loading && (
              <div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Checking API status...</span>
              </div>
            )}

            {apiHealth.error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-200">Server Offline</p>
                  <p className="mt-0.5 text-rose-300/80">{apiHealth.error}</p>
                </div>
              </div>
            )}

            {apiHealth.data && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-200">API Server Healthy</p>
                  <p className="text-emerald-300/80">
                    Status: <span className="text-slate-200 font-mono font-medium">{apiHealth.data.message}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database Health Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">TiDB Cloud Database</h2>
                  <p className="text-xs text-slate-400 font-mono">GET /api/health/db</p>
                </div>
              </div>
            </div>

            {dbHealth.loading && (
              <div className="py-4 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Checking TiDB connection...</span>
              </div>
            )}

            {dbHealth.error && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-200">Database Connection Notice</p>
                  <p className="text-amber-300/80">{dbHealth.error}</p>
                  {dbHealth.data?.missing && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Missing in .env: <span className="text-amber-200 font-mono">{dbHealth.data.missing.join(', ')}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {dbHealth.data && dbHealth.data.success && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-200">TiDB Cloud Connected</p>
                  <p className="text-emerald-300/80">
                    Engine Version: <span className="text-slate-200 font-mono">{dbHealth.data.version}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Architecture / Role Structure Preview */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Role-Based Access Architecture</h2>
          <p className="text-slate-400 text-sm">Configured for Google OAuth authentication & dynamic portal routing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className={`bg-slate-900/60 border ${role.border} rounded-2xl p-6 relative overflow-hidden transition-all hover:bg-slate-900/90`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${role.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full ${role.bgBadge}`}>
                    {role.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{role.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{role.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap & Stack Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technology Foundation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">System Technology Foundation</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="font-semibold text-slate-200">React 19 + Vite</p>
                <p className="text-slate-500">Frontend Client</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <Server className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-semibold text-slate-200">Node + Express</p>
                <p className="text-slate-500">REST API Server</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <Database className="w-4 h-4 text-amber-400" />
              <div>
                <p className="font-semibold text-slate-200">TiDB Cloud</p>
                <p className="text-slate-500">MySQL Connection Pool</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-violet-400" />
              <div>
                <p className="font-semibold text-slate-200">Google OAuth</p>
                <p className="text-slate-500">RBAC Identity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Execution Phases</h3>
          </div>
          <div className="space-y-3 text-xs">
            {milestones.map((m, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-850">
                {m.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-600 mt-0.5 flex-shrink-0 flex items-center justify-center text-[10px] text-slate-500">
                    {idx + 1}
                  </div>
                )}
                <div>
                  <p className={`font-semibold ${m.status === 'completed' ? 'text-emerald-300' : 'text-slate-300'}`}>
                    {m.name}
                  </p>
                  <p className="text-slate-500 text-[11px]">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
