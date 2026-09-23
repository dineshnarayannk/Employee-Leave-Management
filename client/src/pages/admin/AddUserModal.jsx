import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { X, UserPlus, AlertCircle, CheckCircle2, Building2, Mail, User, ShieldCheck, UserCheck } from 'lucide-react';
import { createAdminUser, getActiveManagers } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const addUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid corporate email').transform((v) => v.toLowerCase()),
  department: z.string().trim().min(2, 'Department is required'),
  role_id: z.coerce.number().refine((val) => [2, 3].includes(val), {
    message: 'Please select a valid role (Manager or Employee)',
  }),
  manager_id: z.coerce.number().nullable().optional(),
  is_active: z.boolean().default(true),
});

export default function AddUserModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role_id: 3, // Default to Employee
    manager_id: '',
    is_active: true,
  });

  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        department: '',
        role_id: 3,
        manager_id: '',
        is_active: true,
      });
      setFieldErrors({});
      setServerError(null);

      // Fetch active managers for dropdown
      const loadManagers = async () => {
        setLoadingManagers(true);
        try {
          const res = await getActiveManagers();
          setManagers(res.data || []);
        } catch (err) {
          console.error('Failed to load managers:', err.message);
        } finally {
          setLoadingManagers(false);
        }
      };

      loadManagers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const formattedData = {
      ...formData,
      role_id: Number(formData.role_id),
      manager_id: formData.role_id === 3 && formData.manager_id ? Number(formData.manager_id) : null,
    };

    const validation = addUserSchema.safeParse(formattedData);
    if (!validation.success) {
      const errors = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0]] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdminUser(validation.data);
      onSuccess?.(`User "${formData.name}" created successfully.`);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to create user. Please check the inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add New User</h2>
              <p className="text-xs text-slate-400">Create an Employee or Manager account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Notice */}
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{serverError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Johnson"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
              />
            </div>
            {fieldErrors.name && <p className="text-[11px] text-rose-400">{fieldErrors.name}</p>}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Corporate Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex.johnson@company.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
              />
            </div>
            <p className="text-[10px] text-slate-500">The user will sign in with this verified Google email.</p>
            {fieldErrors.email && <p className="text-[11px] text-rose-400">{fieldErrors.email}</p>}
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Department *</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Engineering, Sales, Human Resources"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
              />
            </div>
            {fieldErrors.department && <p className="text-[11px] text-rose-400">{fieldErrors.department}</p>}
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">User Role *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role_id: 3 }))}
                className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                  Number(formData.role_id) === 3
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Employee (role: 3)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role_id: 2, manager_id: '' }))}
                className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition ${
                  Number(formData.role_id) === 2
                    ? 'bg-blue-500/15 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Manager (role: 2)</span>
              </button>
            </div>
          </div>

          {/* Manager Assignment (Only when Role is Employee) */}
          {Number(formData.role_id) === 3 && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-slate-300">Assign Manager (Optional)</label>
              <select
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                disabled={loadingManagers}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition"
              >
                <option value="">-- No Manager Assigned --</option>
                {managers.map((mgr) => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.name} ({mgr.department}) - {mgr.email}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">Only active users with Manager role (role_id: 2) appear here.</p>
            </div>
          )}

          {/* Active Status Toggle */}
          <div className="pt-1 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="is_active_checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-800 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="is_active_checkbox" className="text-xs text-slate-300 cursor-pointer">
              Account Active immediately upon creation
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              <span>{isSubmitting ? 'Creating User...' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
