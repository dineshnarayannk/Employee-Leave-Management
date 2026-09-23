import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Edit2, 
  Trash2, 
  Power, 
  AlertTriangle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Building2,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { getAdminUsers, updateAdminUserStatus, deleteAdminUser } from '../../services/api';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import UserDetailsModal from './UserDetailsModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addRole, setAddRole] = useState(3); // 3: Employee, 2: Manager
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers({
        search,
        role_id: roleFilter,
        is_active: statusFilter,
        page,
        limit: 10,
      });
      setUsers(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch users list');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active;
    try {
      await updateAdminUserStatus(user.id, newStatus);
      showToast(`User "${user.name}" has been ${newStatus ? 'activated' : 'deactivated'}.`);
      fetchUsers(pagination.page);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdminUser(deletingUser.id);
      showToast(`User "${deletingUser.name}" was safely deleted.`);
      setDeletingUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      setDeleteError(err.message || 'Deletion failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  const roleBadges = {
    1: { name: 'Admin', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: ShieldCheck },
    2: { name: 'Manager', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: UserCheck },
    3: { name: 'Employee', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Users },
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl shadow-indigo-500/40 flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="User Management"
        subtitle="Manage employee directories, manager hierarchies, and user access states"
        icon={Users}
        iconColor="text-purple-400"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAddRole(3);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAddRole(2);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <UserCheck className="w-4 h-4" />
              <span>Add Manager</span>
            </button>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or department..."
              aria-label="Search users"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none transition"
            >
              <option value="">All Roles</option>
              <option value="1">Admin (role_id: 1)</option>
              <option value="2">Manager (role_id: 2)</option>
              <option value="3">Employee (role_id: 3)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none transition"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive (Deactivated)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden backdrop-blur">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-400 animate-pulse">Loading directory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm text-rose-300">{error}</p>
            <button
              onClick={() => fetchUsers(pagination.page)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No users found"
            description="No accounts match your current search or filter criteria."
            actionText="Add New User"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-4 px-6 font-semibold">User / Email</th>
                  <th className="py-4 px-4 font-semibold">Role</th>
                  <th className="py-4 px-4 font-semibold">Department</th>
                  <th className="py-4 px-4 font-semibold">Reporting Manager</th>
                  <th className="py-4 px-4 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const role = roleBadges[u.role_id] || { name: 'User', class: 'bg-slate-800 text-slate-400', icon: Users };
                  const RoleIcon = role.icon;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white text-sm">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${role.class}`}>
                          <RoleIcon className="w-3 h-3" />
                          <span>{role.name}</span>
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-4">
                        <span className="text-slate-300">{u.department || '—'}</span>
                      </td>

                      {/* Reporting Manager */}
                      <td className="py-4 px-4">
                        {u.manager_name ? (
                          <div>
                            <p className="font-medium text-slate-200">{u.manager_name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{u.manager_email}</p>
                          </div>
                        ) : u.role_id === 2 ? (
                          <span className="text-slate-500 italic">Self (Manager)</span>
                        ) : u.role_id === 1 ? (
                          <span className="text-purple-400/80 font-medium">Administrator</span>
                        ) : (
                          <span className="text-amber-400/80 text-[11px] font-medium">Unassigned</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <StatusBadge status={u.is_active ? 'ACTIVE' : 'INACTIVE'} size="xs" />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setViewingUser(u)}
                            aria-label={`View ${u.name} profile details`}
                            title="View Profile Details"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit User */}
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            aria-label={`Edit ${u.name}`}
                            title="Edit User"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            aria-label={u.is_active ? `Deactivate ${u.name}` : `Activate ${u.name}`}
                            title={u.is_active ? 'Deactivate User' : 'Activate User'}
                            className={`p-1.5 rounded-lg transition focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              u.is_active
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Safe Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingUser(u);
                            }}
                            aria-label={`Delete ${u.name}`}
                            title="Delete User"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition focus:outline-none focus:ring-1 focus:ring-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && users.length > 0 && (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>
              Showing <span className="font-semibold text-white">{users.length}</span> of <span className="font-semibold text-white">{pagination.total}</span> total users
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="Previous page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-white font-semibold">
                {pagination.page} / {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                aria-label="Next page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition focus:outline-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        initialRole={addRole}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          showToast('User created successfully.');
          fetchUsers(pagination.page);
        }}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            showToast('User updated successfully.');
            fetchUsers(pagination.page);
          }}
        />
      )}

      {/* User Details Modal */}
      {viewingUser && (
        <UserDetailsModal
          isOpen={!!viewingUser}
          user={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}

      {/* Safe Delete Confirmation Dialog */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Confirm Safe Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete user <strong className="text-white">{deletingUser.name}</strong> ({deletingUser.email})?
            </p>
            <p className="text-[11px] text-slate-500">
              Note: If this user is assigned as a manager to active employees or has historical leave records, the database will safely prevent deletion.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/25 transition disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
