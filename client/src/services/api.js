const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Common API request helper with cookie credentials
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Needed for HTTP-only session cookies
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Backend API Health check
 */
export async function checkBackendHealth() {
  return apiRequest('/health');
}

/**
 * TiDB Database Connection Health check
 */
export async function checkDbHealth() {
  return apiRequest('/health/db');
}

/* ==============================================================================
   AUTHENTICATION API METHODS
   ============================================================================== */

export async function loginWithGoogle(credential) {
  return apiRequest('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export async function getAuthUser() {
  return apiRequest('/auth/me');
}

export async function logoutUser() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
}

/* ==============================================================================
   ADMIN USER MANAGEMENT API METHODS
   ============================================================================== */

/**
 * Fetch paginated, filtered user list for Admin User Management
 * @param {object} params - { search, role_id, is_active, page, limit }
 */
export async function getAdminUsers(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.role_id !== undefined && params.role_id !== '') queryParams.append('role_id', params.role_id);
  if (params.is_active !== undefined && params.is_active !== '') queryParams.append('is_active', params.is_active);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`);
}

/**
 * Fetch single user details
 */
export async function getAdminUserById(userId) {
  return apiRequest(`/admin/users/${userId}`);
}

/**
 * Create a new Employee or Manager
 */
export async function createAdminUser(userData) {
  return apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * Update user details
 */
export async function updateAdminUser(userId, userData) {
  return apiRequest(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
  });
}

/**
 * Update user active / inactive status
 */
export async function updateAdminUserStatus(userId, isActive) {
  return apiRequest(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

/**
 * Delete a user safely (blocks if historical records exist)
 */
export async function deleteAdminUser(userId) {
  return apiRequest(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch list of active managers for dropdowns
 */
export async function getActiveManagers() {
  return apiRequest('/admin/managers');
}

/**
 * Fetch Admin dashboard metrics
 */
export async function getAdminStats() {
  return apiRequest('/admin/stats');
}

/* ==============================================================================
   LEAVE MANAGEMENT ENGINE API METHODS
   ============================================================================== */

/**
 * Fetch active leave types
 */
export async function getLeaveTypes() {
  return apiRequest('/leave-types');
}

/**
 * Fetch authenticated employee leave balances for a specific year
 */
export async function getEmployeeBalances(year) {
  return apiRequest(`/employee/leave-balances${year ? `?year=${year}` : ''}`);
}

/**
 * Submit a new leave request (Employee)
 */
export async function applyForLeave(leaveData) {
  return apiRequest('/employee/leave-requests', {
    method: 'POST',
    body: JSON.stringify(leaveData),
  });
}

/**
 * Fetch filtered/paginated leave requests for Employee
 */
export async function getEmployeeLeaveRequests(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.leave_type_id) queryParams.append('leave_type_id', params.leave_type_id);
  if (params.year) queryParams.append('year', params.year);
  if (params.month) queryParams.append('month', params.month);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  return apiRequest(`/employee/leave-requests${queryString ? `?${queryString}` : ''}`);
}

/**
 * Fetch single leave request details (Employee)
 */
export async function getEmployeeLeaveRequestById(id) {
  return apiRequest(`/employee/leave-requests/${id}`);
}

/**
 * Cancel an eligible pending leave request (Employee)
 */
export async function cancelLeaveRequest(id) {
  return apiRequest(`/employee/leave-requests/${id}/cancel`, {
    method: 'PATCH',
  });
}

/**
 * Fetch Employee dashboard stats
 */
export async function getEmployeeStats() {
  return apiRequest('/employee/stats');
}

/**
 * Fetch filtered/paginated leave requests for Manager (direct reports)
 */
export async function getManagerLeaveRequests(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.leave_type_id) queryParams.append('leave_type_id', params.leave_type_id);
  if (params.employee_id) queryParams.append('employee_id', params.employee_id);
  if (params.year) queryParams.append('year', params.year);
  if (params.month) queryParams.append('month', params.month);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  return apiRequest(`/manager/leave-requests${queryString ? `?${queryString}` : ''}`);
}

/**
 * Fetch single leave request details (Manager)
 */
export async function getManagerLeaveRequestById(id) {
  return apiRequest(`/manager/leave-requests/${id}`);
}

/**
 * Approve a pending leave request (Manager)
 */
export async function approveLeaveRequest(id, response = '') {
  return apiRequest(`/manager/leave-requests/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ response }),
  });
}

/**
 * Reject a pending leave request (Manager)
 */
export async function rejectLeaveRequest(id, response) {
  return apiRequest(`/manager/leave-requests/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ response }),
  });
}

/**
 * Fetch team leave balances for Manager
 */
export async function getTeamBalances(year) {
  return apiRequest(`/manager/team-balances${year ? `?year=${year}` : ''}`);
}

/**
 * Fetch Manager dashboard stats
 */
export async function getManagerStats() {
  return apiRequest('/manager/stats');
}

/**
 * Fetch user notifications
 */
export async function getNotifications(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.unread !== undefined) queryParams.append('unread', params.unread);
  if (params.limit) queryParams.append('limit', params.limit);
  const queryString = queryParams.toString();
  return apiRequest(`/notifications${queryString ? `?${queryString}` : ''}`);
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(id) {
  return apiRequest(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead() {
  return apiRequest('/notifications/read-all', {
    method: 'PATCH',
  });
}


