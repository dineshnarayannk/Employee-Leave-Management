import React from 'react';
import { Users } from 'lucide-react';

export default function EmployeeDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-emerald-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Portal (role_id: 3)</h1>
          <p className="text-sm text-slate-400">Placeholder for Leave applications and personal balance tracking</p>
        </div>
      </div>
    </div>
  );
}
