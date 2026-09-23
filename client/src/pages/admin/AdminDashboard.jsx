import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Portal (role_id: 1)</h1>
          <p className="text-sm text-slate-400">Placeholder for Admin leave policies and user governance</p>
        </div>
      </div>
    </div>
  );
}
