import React from 'react';
import { UserCheck } from 'lucide-react';

export default function ManagerDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <UserCheck className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Manager Portal (role_id: 2)</h1>
          <p className="text-sm text-slate-400">Placeholder for Team leave approvals and direct report calendar</p>
        </div>
      </div>
    </div>
  );
}
