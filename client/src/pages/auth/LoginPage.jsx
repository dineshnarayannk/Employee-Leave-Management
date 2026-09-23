import React from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <LogIn className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Sign In</h2>
          <p className="text-sm text-slate-400 mt-1">Google OAuth login will be activated in the next step</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2 text-left">
          <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <span>Role-Based routing (Admin / Manager / Employee) based on verified email domain.</span>
        </div>
      </div>
    </div>
  );
}
