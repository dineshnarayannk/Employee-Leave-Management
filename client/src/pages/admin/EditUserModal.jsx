import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { X, UserCheck, AlertCircle, Building2, Mail, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { updateAdminUser, getActiveManagers } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const editUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid corporate email').transform((v) => v.toLowerCase()),
  department: z.string().trim().min(2, 'Department is required'),
  role_id: z.coerce.number().refine((val) => [1, 2, 3].includes(val), {
    message: 'Please select a valid role',
  }),
  manager_id: z.coerce.number().nullable().optional(),
  is_active: z.boolean(),
});

export default function EditUserModal({ isOpen, user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role_id: 3,
    manager_id: '',
    is_active: true,
  });

  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        role_id: user.role_id || 3,
        manager_id: user.manager_id || '',
        is_active: Boolean(user.is_active),
      });
      setFieldErrors({});
      setServerError(null);

      // Fetch active managers
      const loadManagers = async () => {
        setLoadingManagers(true);
        try {
          const res = await getActiveManagers();
          // Filter out the user being edited to prevent self-assignment
          const validManagers = (res.data || []).filter((m) => Number(m.id) !== Number(user.id));
          setManagers(validManagers);
        } catch (err) {
          console.error('Failed to load managers:', err.message);
        } finally {
          setLoadingManagers(false);
        }
      };

      loadManagers();
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

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

    // Prevent self-assignment check
    if (formattedData.manager_id && Number(formattedData.manager_id) === Number(user.id)) {
      setFieldErrors({ manager_id: 'A user cannot be assigned as their own manager.' });
      return;
    }

    const validation = editUserSchema.safeParse(formattedData);
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
      await updateAdminUser(user.id, validation.data);
      onSuccess?.(`User "${formData.name}" updated successfully.`);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to update user.');
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
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit User Profile</h2>
              <p className="text-xs text-slate-400">Modify permissions & organizational placement</p>
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
              />
            </div>
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition"
              />
            </div>
            {fieldErrors.department && <p className="text-[11px] text-rose-400">{fieldErrors.department}</p>}
          </div>

          {/* Role Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Role Assignment *</label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              disabled={user.role_id === 1} // Do not alter master admin role
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition disabled:opacity-50"
            >
              {user.role_id === 1 && <option value="1">Admin (role_id: 1)</option>}
              <option value="2">Manager (role_id: 2)</option>
              <option value="3">Employee (role_id: 3)</option>
            </select>
          </div>

          {/* Manager Assignment (Only when Employee) */}
          {Number(formData.role_id) === 3 && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-slate-300">Reporting Manager</label>
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
              {fieldErrors.manager_id && <p className="text-[11px] text-rose-400">{fieldErrors.manager_id}</p>}
            </div>
          )}

          {/* Active Status Toggle */}
          <div className="pt-2 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="edit_is_active_checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-800 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="edit_is_active_checkbox" className="text-xs text-slate-300 cursor-pointer">
              Account is Active (unchecking prevents user login immediately)
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
