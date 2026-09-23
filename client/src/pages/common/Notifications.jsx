import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  Filter,
  ArrowRight,
  Inbox
} from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterUnread, setFilterUnread] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getNotifications({
        unread: filterUnread ? true : undefined,
        limit: 100,
      });
      setNotifications(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filterUnread]);

  const handleMarkSingleRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      setError(err.message || 'Failed to update notification status.');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setActionSuccess('All notifications marked as read.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications as read.');
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      handleMarkSingleRead(notif.id);
    }
    if (notif.leave_request_id) {
      if (user?.role_id === 2) {
        navigate(`/manager/leave-requests/${notif.leave_request_id}`);
      } else if (user?.role_id === 3) {
        navigate(`/employee/leave-requests/${notif.leave_request_id}`);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <PageHeader
        title="Notification Center"
        subtitle="Real-time activity feed for leave submissions, manager approvals, rejections, and cancellations"
        icon={Bell}
        iconColor="text-indigo-400"
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold transition focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
            )}

            {/* Toggle Unread filter */}
            <button
              type="button"
              onClick={() => setFilterUnread(!filterUnread)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                filterUnread
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterUnread ? 'Showing Unread' : 'All Notifications'}</span>
            </button>
          </div>
        }
      />

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
          <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadNotifications}
            className="text-xs font-semibold underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Notifications Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading your notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No notifications found"
            description={
              filterUnread
                ? 'You are all caught up with your unread notifications!'
                : 'Activity and leave status updates will appear here once submitted.'
            }
          />
        ) : (
          <div className="divide-y divide-slate-800/60">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition cursor-pointer ${
                  n.is_read
                    ? 'hover:bg-slate-800/30 text-slate-400'
                    : 'bg-indigo-500/5 hover:bg-indigo-500/10 text-slate-100'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.is_read
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <p className={`text-xs sm:text-sm leading-relaxed ${n.is_read ? 'text-slate-300' : 'font-semibold text-white'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      {n.leave_request_id && (
                        <span className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <span>View Request #{n.leave_request_id}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkSingleRead(n.id, e)}
                    aria-label="Mark as read"
                    title="Mark as read"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition shrink-0 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
