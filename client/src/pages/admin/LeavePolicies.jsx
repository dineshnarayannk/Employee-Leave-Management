import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminLeaveTypes,
  createAdminLeaveType,
  updateAdminLeaveType,
  updateAdminLeaveTypeStatus,
  deleteAdminLeaveType,
} from '../../services/api';
import {
  Shield,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';

export default function LeavePolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_days: 10,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirmation
  const [deletingPolicy, setDeletingPolicy] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminLeaveTypes();
      setPolicies(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const openCreateModal = () => {
    setEditingPolicy(null);
    setFormData({
      name: '',
      description: '',
      default_days: 12,
      is_active: true,
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description || '',
      default_days: policy.default_days,
      is_active: policy.is_active,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Policy Name is required.');
      return;
    }

    try {
      setSaving(true);
      if (editingPolicy) {
        await updateAdminLeaveType(editingPolicy.id, formData);
        setSuccessMessage(`Leave policy "${formData.name}" updated successfully.`);
      } else {
        await createAdminLeaveType(formData);
        setSuccessMessage(`Leave policy "${formData.name}" created successfully.`);
      }
      setShowModal(false);
      fetchPolicies();
    } catch (err) {
      setFormError(err.message || 'Failed to save policy.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (policy) => {
    try {
      const newStatus = !policy.is_active;
      await updateAdminLeaveTypeStatus(policy.id, newStatus);
      setSuccessMessage(`Policy "${policy.name}" is now ${newStatus ? 'active' : 'inactive'}.`);
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, is_active: newStatus } : p))
      );
    } catch (err) {
      setError(err.message || 'Failed to update policy status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPolicy) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await deleteAdminLeaveType(deletingPolicy.id);
      setSuccessMessage(`Policy "${deletingPolicy.name}" was successfully deleted.`);
      setDeletingPolicy(null);
      fetchPolicies();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete policy.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Shield className="w-4 h-4" />
            <span>Company Policies</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Leave Policy Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure annual leave allocations, create leave categories, and manage organizational time-off rules.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-purple-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Leave Policy</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-400 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold underline hover:text-emerald-300 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-rose-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchPolicies}
            className="text-xs font-semibold underline hover:text-rose-300 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Info Card */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Policy Rules:</span> Changes to default allocations apply to new employee initialization. Active categories are visible in the employee leave application portal. Categories referenced by existing leave requests or quotas cannot be deleted destructively; use deactivation instead to preserve historical integrity.
        </div>
      </div>

      {/* Policy Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-medium text-slate-300">No leave policies found</p>
          <p className="text-xs text-slate-500 mt-1">Create your first company leave policy to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                policy.is_active
                  ? 'border-slate-800 hover:border-slate-700 shadow-md'
                  : 'border-slate-800/40 opacity-70 bg-slate-950/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    {policy.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      policy.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {policy.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 min-h-[36px] line-clamp-2">
                  {policy.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Default Allocation</span>
                    <span className="text-lg font-bold text-purple-400">
                      {policy.default_days} <span className="text-xs font-normal text-slate-400">days/year</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Usage Scope</span>
                    <span className="text-xs font-medium text-slate-300">
                      {policy.total_requests_count} request(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(policy)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                    policy.is_active
                      ? 'text-slate-400 hover:text-amber-300 border-slate-800 hover:border-amber-500/30'
                      : 'text-emerald-400 hover:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/10'
                  }`}
                >
                  {policy.is_active ? 'Deactivate' : 'Activate'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(policy)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Edit Policy"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingPolicy(policy);
                      setDeleteError(null);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Policy"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Policy Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-1">
              {editingPolicy ? `Edit Leave Policy: ${editingPolicy.name}` : 'Create New Leave Policy'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {editingPolicy
                ? 'Update allocation days or description.'
                : 'Define a new leave category and annual default allowance.'}
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Policy Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Parental Leave, Sabbatical"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Annual Allowance (Days) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.default_days}
                  onChange={(e) => setFormData({ ...formData, default_days: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Policy guidelines and eligibility..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 resize-none text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-xs text-slate-300 cursor-pointer font-medium">
                  Active policy (available for employee applications)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium transition flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPolicy ? 'Update Policy' : 'Create Policy'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white mb-2">Delete Leave Policy</h2>
            <p className="text-xs text-slate-300 mb-3">
              Are you sure you want to delete <span className="font-semibold text-rose-400">"{deletingPolicy.name}"</span>?
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>{deleteError}</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingPolicy(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-medium transition flex items-center gap-2"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
