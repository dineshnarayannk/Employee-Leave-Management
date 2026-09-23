import { query } from '../db/index.js';
import { formatISODate, calculateInclusiveDays } from '../utils/dateUtils.js';

/**
 * Fetch paginated, filtered list of users for Admin User Management
 */
export async function getUsers({ search, role_id, is_active, page = 1, limit = 10 }) {
  const whereClauses = [];
  const params = [];

  if (search) {
    whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.department LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (role_id !== undefined && role_id !== null && !isNaN(role_id)) {
    whereClauses.push('u.role_id = ?');
    params.push(role_id);
  }

  if (is_active !== undefined) {
    whereClauses.push('u.is_active = ?');
    params.push(is_active ? 1 : 0);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching records
  const countSql = `SELECT COUNT(*) AS total FROM users u ${whereSql}`;
  const countResult = await query(countSql, params);
  const total = Number(countResult[0]?.total || 0);

  // Fetch paginated records with role and manager information
  const offset = (page - 1) * limit;
  const dataSql = `
    SELECT 
      u.id,
      u.google_id,
      u.name,
      u.email,
      u.role_id,
      r.name AS role_name,
      u.department,
      u.manager_id,
      m.name AS manager_name,
      m.email AS manager_email,
      u.is_active,
      u.created_at,
      u.updated_at
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN users m ON u.manager_id = m.id
    ${whereSql}
    ORDER BY u.id DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await query(dataSql, [...params, limit, offset]);

  const users = rows.map((u) => ({
    id: u.id,
    google_id: u.google_id,
    name: u.name,
    email: u.email,
    role_id: u.role_id,
    role_name: u.role_name,
    department: u.department,
    manager_id: u.manager_id,
    manager_name: u.manager_name || null,
    manager_email: u.manager_email || null,
    is_active: Boolean(u.is_active),
    created_at: u.created_at,
    updated_at: u.updated_at,
  }));

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Fetch detailed user record by ID
 */
export async function getUserById(userId) {
  const sql = `
    SELECT 
      u.id,
      u.google_id,
      u.name,
      u.email,
      u.role_id,
      r.name AS role_name,
      u.department,
      u.manager_id,
      m.name AS manager_name,
      m.email AS manager_email,
      u.is_active,
      u.created_at,
      u.updated_at
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN users m ON u.manager_id = m.id
    WHERE u.id = ?
    LIMIT 1
  `;

  const rows = await query(sql, [userId]);
  if (!rows || rows.length === 0) {
    const error = new Error(`User with ID ${userId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const u = rows[0];

  // Fetch count of direct reports if user is a manager
  const directReportsSql = `SELECT COUNT(*) AS count FROM users WHERE manager_id = ? AND is_active = TRUE`;
  const directReportsResult = await query(directReportsSql, [userId]);
  const directReportsCount = Number(directReportsResult[0]?.count || 0);

  return {
    id: u.id,
    google_id: u.google_id,
    name: u.name,
    email: u.email,
    role_id: u.role_id,
    role_name: u.role_name,
    department: u.department,
    manager_id: u.manager_id,
    manager_name: u.manager_name || null,
    manager_email: u.manager_email || null,
    is_active: Boolean(u.is_active),
    direct_reports_count: directReportsCount,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}

/**
 * Create a new user (Employee or Manager)
 */
export async function createUser(data, adminId) {
  const email = data.email.toLowerCase().trim();

  // 1. Check if email already exists
  const existingUsers = await query('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
  if (existingUsers && existingUsers.length > 0) {
    const error = new Error(`A user with email "${email}" is already registered.`);
    error.statusCode = 409;
    throw error;
  }

  // 2. Validate manager assignment
  let managerId = data.manager_id || null;
  if (data.role_id === 3 && managerId) {
    const manager = await query('SELECT id, role_id, is_active FROM users WHERE id = ?', [managerId]);
    if (!manager || manager.length === 0) {
      const error = new Error('Assigned manager does not exist.');
      error.statusCode = 400;
      throw error;
    }
    if (manager[0].role_id !== 2) {
      const error = new Error('Assigned manager must have a Manager role (role_id: 2).');
      error.statusCode = 400;
      throw error;
    }
    if (!manager[0].is_active) {
      const error = new Error('Cannot assign an inactive user as manager.');
      error.statusCode = 400;
      throw error;
    }
  } else if (data.role_id === 2) {
    // Managers do not require manager assignment
    managerId = null;
  }

  // 3. Insert user record
  const insertSql = `
    INSERT INTO users (name, email, role_id, department, manager_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const insertResult = await query(insertSql, [
    data.name.trim(),
    email,
    data.role_id,
    data.department.trim(),
    managerId,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
  ]);

  const newUserId = insertResult.insertId;

  // 4. Log audit record
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'USER_CREATED', 'user', ?, ?)`,
      [
        adminId,
        newUserId,
        JSON.stringify({
          name: data.name,
          email,
          role_id: data.role_id,
          department: data.department,
          manager_id: managerId,
        }),
      ]
    );
  } catch (auditErr) {
    console.error('Warning: Failed to create audit log for user creation:', auditErr.message);
  }

  return getUserById(newUserId);
}

/**
 * Update user details
 */
export async function updateUser(userId, data, adminId) {
  // 1. Verify user exists
  const targetUser = await getUserById(userId);

  const updates = [];
  const params = [];
  const auditDetails = {};

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name.trim());
    auditDetails.name = data.name.trim();
  }

  if (data.email !== undefined) {
    const email = data.email.toLowerCase().trim();
    if (email !== targetUser.email.toLowerCase()) {
      const existing = await query('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [email, userId]);
      if (existing && existing.length > 0) {
        const error = new Error(`Email "${email}" is already in use by another user.`);
        error.statusCode = 409;
        throw error;
      }
      updates.push('email = ?');
      params.push(email);
      auditDetails.email = email;
    }
  }

  if (data.department !== undefined) {
    updates.push('department = ?');
    params.push(data.department.trim());
    auditDetails.department = data.department.trim();
  }

  if (data.role_id !== undefined) {
    // If changing from Manager to Employee, check if they manage active employees
    if (targetUser.role_id === 2 && data.role_id === 3) {
      const reports = await query('SELECT COUNT(*) AS count FROM users WHERE manager_id = ?', [userId]);
      if (Number(reports[0]?.count || 0) > 0) {
        auditDetails.roleChangeNotice = `User had ${reports[0].count} direct reports before role demotion.`;
      }
    }
    updates.push('role_id = ?');
    params.push(data.role_id);
    auditDetails.role_id = data.role_id;
  }

  if (data.manager_id !== undefined) {
    const managerId = data.manager_id;
    if (managerId) {
      // Prevent self-assignment
      if (Number(managerId) === Number(userId)) {
        const error = new Error('A user cannot be assigned as their own manager.');
        error.statusCode = 400;
        throw error;
      }

      // Verify manager exists and is active
      const manager = await query('SELECT id, role_id, is_active FROM users WHERE id = ?', [managerId]);
      if (!manager || manager.length === 0) {
        const error = new Error('Assigned manager does not exist.');
        error.statusCode = 400;
        throw error;
      }
      if (manager[0].role_id !== 2) {
        const error = new Error('Assigned manager must have a Manager role (role_id: 2).');
        error.statusCode = 400;
        throw error;
      }
      if (!manager[0].is_active) {
        const error = new Error('Cannot assign an inactive user as manager.');
        error.statusCode = 400;
        throw error;
      }
    }

    updates.push('manager_id = ?');
    params.push(managerId);
    auditDetails.manager_id = managerId;
  }

  if (data.is_active !== undefined) {
    // Prevent admin from deactivating self
    if (Number(userId) === Number(adminId) && !data.is_active) {
      const error = new Error('Admin cannot deactivate their own active account.');
      error.statusCode = 400;
      throw error;
    }
    updates.push('is_active = ?');
    params.push(data.is_active ? 1 : 0);
    auditDetails.is_active = data.is_active;
  }

  if (updates.length === 0) {
    return targetUser;
  }

  const updateSql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  await query(updateSql, [...params, userId]);

  // Log audit
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'USER_UPDATED', 'user', ?, ?)`,
      [adminId, userId, JSON.stringify(auditDetails)]
    );
  } catch (auditErr) {
    console.error('Warning: Failed to create audit log for user update:', auditErr.message);
  }

  return getUserById(userId);
}

/**
 * Activate or deactivate user
 */
export async function updateUserStatus(userId, isActive, adminId) {
  const targetUser = await getUserById(userId);

  if (Number(userId) === Number(adminId) && !isActive) {
    const error = new Error('Admin cannot deactivate their own active account.');
    error.statusCode = 400;
    throw error;
  }

  await query('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
    isActive ? 1 : 0,
    userId,
  ]);

  const action = isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'user', ?, ?)`,
      [adminId, action, userId, JSON.stringify({ is_active: isActive, email: targetUser.email })]
    );
  } catch (auditErr) {
    console.error('Warning: Failed to create audit log for status update:', auditErr.message);
  }

  return getUserById(userId);
}

/**
 * Safely delete user only if no historical dependencies exist
 */
export async function deleteUser(userId, adminId) {
  const targetUser = await getUserById(userId);

  if (Number(userId) === Number(adminId)) {
    const error = new Error('Admin cannot delete their own account.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Check leave requests
  const leaveReqs = await query(
    'SELECT COUNT(*) AS count FROM leave_requests WHERE employee_id = ? OR manager_id = ?',
    [userId, userId]
  );
  const leaveReqCount = Number(leaveReqs[0]?.count || 0);

  // 2. Check leave balances
  const leaveBalances = await query(
    'SELECT COUNT(*) AS count FROM leave_balances WHERE employee_id = ?',
    [userId]
  );
  const balanceCount = Number(leaveBalances[0]?.count || 0);

  // 3. Check direct reports (if user is manager)
  const reports = await query('SELECT COUNT(*) AS count FROM users WHERE manager_id = ?', [userId]);
  const reportsCount = Number(reports[0]?.count || 0);

  // Block deletion if related records exist
  if (leaveReqCount > 0 || balanceCount > 0 || reportsCount > 0) {
    const reasons = [];
    if (leaveReqCount > 0) reasons.push(`${leaveReqCount} historical leave request(s)`);
    if (balanceCount > 0) reasons.push(`${balanceCount} leave balance quota(s)`);
    if (reportsCount > 0) reasons.push(`${reportsCount} assigned direct report(s)`);

    // Log deletion blocked event
    try {
      await query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES (?, 'USER_DELETION_BLOCKED', 'user', ?, ?)`,
        [adminId, userId, JSON.stringify({ reasons, email: targetUser.email })]
      );
    } catch (auditErr) {
      console.error('Warning: Failed to log deletion blocked event:', auditErr.message);
    }

    const error = new Error(
      `Cannot delete user "${targetUser.name}" (${targetUser.email}) because related historical records exist (${reasons.join(', ')}). Please deactivate the user instead to preserve audit and organizational history.`
    );
    error.statusCode = 409;
    error.reasons = reasons;
    throw error;
  }

  // If no dependencies, execute delete
  await query('DELETE FROM users WHERE id = ?', [userId]);

  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'USER_DELETED', 'user', ?, ?)`,
      [adminId, userId, JSON.stringify({ email: targetUser.email, name: targetUser.name })]
    );
  } catch (auditErr) {
    console.error('Warning: Failed to log user deletion:', auditErr.message);
  }

  return {
    success: true,
    message: `User "${targetUser.name}" was safely deleted.`,
  };
}

/**
 * Fetch active managers for dropdown selection
 */
export async function getActiveManagers() {
  const sql = `
    SELECT id, name, email, department 
    FROM users 
    WHERE role_id = 2 AND is_active = TRUE 
    ORDER BY name ASC
  `;
  const rows = await query(sql);
  return rows;
}

/**
 * Fetch overall organizational stats for Admin Dashboard
 */
export async function getAdminDashboardStats() {
  const [totalUsers] = await query('SELECT COUNT(*) AS count FROM users');
  const [activeEmployees] = await query('SELECT COUNT(*) AS count FROM users WHERE role_id = 3 AND is_active = TRUE');
  const [activeManagers] = await query('SELECT COUNT(*) AS count FROM users WHERE role_id = 2 AND is_active = TRUE');
  const [departments] = await query('SELECT COUNT(DISTINCT department) AS count FROM users WHERE department IS NOT NULL');
  const [pendingLeaves] = await query("SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'PENDING'");

  return {
    totalUsers: Number(totalUsers?.count || 0),
    activeEmployees: Number(activeEmployees?.count || 0),
    activeManagers: Number(activeManagers?.count || 0),
    totalDepartments: Number(departments?.count || 0),
    pendingLeaves: Number(pendingLeaves?.count || 0),
  };
}

/**
 * Fetch Comprehensive System-wide Analytics for Admin (Step 7)
 */
export async function getAdminAnalytics(year = new Date().getFullYear()) {
  const numericYear = Number(year) || new Date().getFullYear();

  // 1. High-level Summary counts for the selected year
  const summarySql = `
    SELECT 
      COUNT(*) AS total_requests,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_requests,
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_requests,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_requests,
      SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_requests
    FROM leave_requests
    WHERE YEAR(start_date) = ? OR YEAR(end_date) = ?
  `;
  const [summaryRow] = await query(summarySql, [numericYear, numericYear]);

  // Total approved leave days calculation (using inclusive days for approved requests)
  const approvedDaysSql = `
    SELECT start_date, end_date
    FROM leave_requests
    WHERE status = 'APPROVED' AND (YEAR(start_date) = ? OR YEAR(end_date) = ?)
  `;
  const approvedRows = await query(approvedDaysSql, [numericYear, numericYear]);
  let totalApprovedDays = 0;
  for (const r of approvedRows) {
    const s = formatISODate(r.start_date);
    const e = formatISODate(r.end_date);
    try {
      totalApprovedDays += calculateInclusiveDays(s, e);
    } catch (err) {}
  }

  // 2. Monthly Trend (12 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrend = monthNames.map((name, idx) => ({
    month: name,
    monthIndex: idx + 1,
    totalRequests: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    cancelled: 0,
    approvedDays: 0,
  }));

  const allYearRequestsSql = `
    SELECT id, start_date, end_date, status
    FROM leave_requests
    WHERE YEAR(start_date) = ? OR YEAR(end_date) = ?
  `;
  const yearRequests = await query(allYearRequestsSql, [numericYear, numericYear]);

  for (const req of yearRequests) {
    const s = formatISODate(req.start_date);
    const e = formatISODate(req.end_date);
    const startMonth = new Date(s).getUTCMonth(); // 0 to 11
    if (startMonth >= 0 && startMonth < 12) {
      monthlyTrend[startMonth].totalRequests++;
      if (req.status === 'APPROVED') {
        monthlyTrend[startMonth].approved++;
        try {
          monthlyTrend[startMonth].approvedDays += calculateInclusiveDays(s, e);
        } catch (err) {}
      } else if (req.status === 'PENDING') {
        monthlyTrend[startMonth].pending++;
      } else if (req.status === 'REJECTED') {
        monthlyTrend[startMonth].rejected++;
      } else if (req.status === 'CANCELLED') {
        monthlyTrend[startMonth].cancelled++;
      }
    }
  }

  // 3. Status Distribution
  const pendingCount = Number(summaryRow?.pending_requests || 0);
  const approvedCount = Number(summaryRow?.approved_requests || 0);
  const rejectedCount = Number(summaryRow?.rejected_requests || 0);
  const cancelledCount = Number(summaryRow?.cancelled_requests || 0);
  const totalRequests = Number(summaryRow?.total_requests || 0);

  const statusDistribution = [
    { status: 'APPROVED', label: 'Approved', count: approvedCount, color: '#10B981' },
    { status: 'PENDING', label: 'Pending', count: pendingCount, color: '#F59E0B' },
    { status: 'REJECTED', label: 'Rejected', count: rejectedCount, color: '#EF4444' },
    { status: 'CANCELLED', label: 'Cancelled', count: cancelledCount, color: '#64748B' },
  ];

  // 4. Leave Type Usage Breakdown
  const leaveTypeUsageSql = `
    SELECT 
      lt.id AS leave_type_id,
      lt.name AS leave_type_name,
      COUNT(lr.id) AS total_requests,
      SUM(CASE WHEN lr.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count
    FROM leave_types lt
    LEFT JOIN leave_requests lr ON lt.id = lr.leave_type_id AND (YEAR(lr.start_date) = ? OR YEAR(lr.end_date) = ?)
    GROUP BY lt.id, lt.name
    ORDER BY total_requests DESC
  `;
  const leaveTypeRows = await query(leaveTypeUsageSql, [numericYear, numericYear]);
  const leaveTypeUsage = leaveTypeRows.map((r) => ({
    leave_type_id: r.leave_type_id,
    name: r.leave_type_name,
    totalRequests: Number(r.total_requests || 0),
    approvedCount: Number(r.approved_count || 0),
  }));

  // 5. Department Breakdown
  const departmentSql = `
    SELECT 
      COALESCE(u.department, 'Unassigned') AS department,
      COUNT(DISTINCT u.id) AS total_employees,
      COUNT(lr.id) AS total_requests,
      SUM(CASE WHEN lr.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_requests
    FROM users u
    LEFT JOIN leave_requests lr ON u.id = lr.employee_id AND (YEAR(lr.start_date) = ? OR YEAR(lr.end_date) = ?)
    WHERE u.role_id = 3
    GROUP BY COALESCE(u.department, 'Unassigned')
    ORDER BY total_requests DESC
  `;
  const deptRows = await query(departmentSql, [numericYear, numericYear]);
  const departmentBreakdown = deptRows.map((d) => ({
    department: d.department,
    totalEmployees: Number(d.total_employees || 0),
    totalRequests: Number(d.total_requests || 0),
    approvedRequests: Number(d.approved_requests || 0),
  }));

  // Total organization users overview
  const orgStats = await getAdminDashboardStats();

  return {
    year: numericYear,
    summary: {
      totalUsers: orgStats.totalUsers,
      activeEmployees: orgStats.activeEmployees,
      activeManagers: orgStats.activeManagers,
      totalDepartments: orgStats.totalDepartments,
      totalRequests,
      pendingRequests: pendingCount,
      approvedRequests: approvedCount,
      rejectedRequests: rejectedCount,
      cancelledRequests: cancelledCount,
      approvedLeaveDays: totalApprovedDays,
    },
    monthlyTrend,
    statusDistribution,
    leaveTypeUsage,
    departmentBreakdown,
  };
}

/**
 * Fetch Comprehensive System-wide Tabular Leave Reports for Admin (Step 7)
 */
export async function getAdminReports({
  year,
  status,
  leave_type_id,
  department,
  search,
  page = 1,
  limit = 50,
}) {
  const whereClauses = [];
  const params = [];

  if (year) {
    whereClauses.push('(YEAR(lr.start_date) = ? OR YEAR(lr.end_date) = ?)');
    params.push(year, year);
  }

  if (status) {
    whereClauses.push('lr.status = ?');
    params.push(status);
  }

  if (leave_type_id) {
    whereClauses.push('lr.leave_type_id = ?');
    params.push(leave_type_id);
  }

  if (department) {
    whereClauses.push('u.department = ?');
    params.push(department);
  }

  if (search) {
    whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR lr.reason LIKE ? OR lt.name LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total records
  const countSql = `
    SELECT COUNT(*) AS total 
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    ${whereSql}
  `;
  const [countRes] = await query(countSql, params);
  const total = Number(countRes?.total || 0);

  // Paginated query
  const offset = (page - 1) * limit;
  const dataSql = `
    SELECT 
      lr.id,
      lr.employee_id,
      u.name AS employee_name,
      u.email AS employee_email,
      u.department AS employee_department,
      lr.manager_id,
      m.name AS manager_name,
      lr.leave_type_id,
      lt.name AS leave_type_name,
      lr.start_date,
      lr.end_date,
      lr.reason,
      lr.status,
      lr.manager_response,
      lr.reviewed_at,
      lr.created_at
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    JOIN users m ON lr.manager_id = m.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    ${whereSql}
    ORDER BY lr.start_date DESC, lr.id DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await query(dataSql, [...params, limit, offset]);

  let totalApprovedDays = 0;
  const records = rows.map((r) => {
    const formattedStart = formatISODate(r.start_date);
    const formattedEnd = formatISODate(r.end_date);
    const duration = calculateInclusiveDays(formattedStart, formattedEnd);

    if (r.status === 'APPROVED') {
      totalApprovedDays += duration;
    }

    return {
      id: r.id,
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      employee_email: r.employee_email,
      employee_department: r.employee_department,
      manager_id: r.manager_id,
      manager_name: r.manager_name,
      leave_type_id: r.leave_type_id,
      leave_type_name: r.leave_type_name,
      start_date: formattedStart,
      end_date: formattedEnd,
      days: duration,
      reason: r.reason,
      status: r.status,
      manager_response: r.manager_response,
      reviewed_at: r.reviewed_at,
      created_at: r.created_at,
    };
  });

  return {
    records,
    summary: {
      totalRecords: total,
      pageApprovedDays: totalApprovedDays,
    },
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Fetch All Leave Types with Usage Stats for Policy Management (Admin)
 */
export async function getAdminLeaveTypes() {
  const sql = `
    SELECT 
      lt.id,
      lt.name,
      lt.description,
      lt.default_days,
      lt.is_active,
      lt.created_at,
      lt.updated_at,
      (SELECT COUNT(*) FROM leave_requests WHERE leave_type_id = lt.id) AS total_requests_count,
      (SELECT COUNT(*) FROM leave_balances WHERE leave_type_id = lt.id) AS allocated_balances_count
    FROM leave_types lt
    ORDER BY lt.id ASC
  `;
  const rows = await query(sql);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || '',
    default_days: Number(r.default_days),
    is_active: Boolean(r.is_active),
    total_requests_count: Number(r.total_requests_count || 0),
    allocated_balances_count: Number(r.allocated_balances_count || 0),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 * Create a new Leave Type Policy (Admin)
 */
export async function createLeaveType(adminId, data) {
  const { name, description = '', default_days = 0, is_active = true } = data;

  // Check unique name
  const [existing] = await query('SELECT id FROM leave_types WHERE name = ?', [name]);
  if (existing) {
    const error = new Error(`Leave policy "${name}" already exists.`);
    error.statusCode = 409;
    throw error;
  }

  const result = await query(
    `INSERT INTO leave_types (name, description, default_days, is_active)
     VALUES (?, ?, ?, ?)`,
    [name, description, default_days, is_active ? 1 : 0]
  );

  const newId = result.insertId;

  // Log audit
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'LEAVE_TYPE_CREATED', 'leave_type', ?, ?)`,
      [adminId, newId, JSON.stringify({ name, default_days, is_active })]
    );
  } catch (err) {}

  return {
    id: newId,
    name,
    description,
    default_days,
    is_active,
  };
}

/**
 * Update an existing Leave Type Policy (Admin)
 */
export async function updateLeaveType(adminId, leaveTypeId, data) {
  const [existing] = await query('SELECT * FROM leave_types WHERE id = ?', [leaveTypeId]);
  if (!existing) {
    const error = new Error(`Leave policy #${leaveTypeId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const { name, description, default_days, is_active } = data;

  // If changing name, verify uniqueness
  if (name && name !== existing.name) {
    const [dup] = await query('SELECT id FROM leave_types WHERE name = ? AND id != ?', [name, leaveTypeId]);
    if (dup) {
      const error = new Error(`Leave policy name "${name}" is already in use.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const updatedName = name !== undefined ? name : existing.name;
  const updatedDesc = description !== undefined ? description : existing.description;
  const updatedDays = default_days !== undefined ? default_days : existing.default_days;
  const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

  await query(
    `UPDATE leave_types 
     SET name = ?, description = ?, default_days = ?, is_active = ?
     WHERE id = ?`,
    [updatedName, updatedDesc, updatedDays, updatedActive, leaveTypeId]
  );

  // Log audit
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'LEAVE_TYPE_UPDATED', 'leave_type', ?, ?)`,
      [adminId, leaveTypeId, JSON.stringify({ name: updatedName, default_days: updatedDays, is_active: Boolean(updatedActive) })]
    );
  } catch (err) {}

  return {
    id: leaveTypeId,
    name: updatedName,
    description: updatedDesc,
    default_days: Number(updatedDays),
    is_active: Boolean(updatedActive),
  };
}

/**
 * Toggle Leave Type Active Status (Admin)
 */
export async function updateLeaveTypeStatus(adminId, leaveTypeId, isActive) {
  const [existing] = await query('SELECT id, name FROM leave_types WHERE id = ?', [leaveTypeId]);
  if (!existing) {
    const error = new Error(`Leave policy #${leaveTypeId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  await query('UPDATE leave_types SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, leaveTypeId]);

  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'LEAVE_TYPE_STATUS_UPDATED', 'leave_type', ?, ?)`,
      [adminId, leaveTypeId, JSON.stringify({ name: existing.name, is_active: isActive })]
    );
  } catch (err) {}

  return {
    success: true,
    message: `Leave policy "${existing.name}" is now ${isActive ? 'active' : 'inactive'}.`,
    is_active: isActive,
  };
}

/**
 * Safely delete a Leave Type Policy if unreferenced (Admin)
 */
export async function deleteLeaveType(adminId, leaveTypeId) {
  const [existing] = await query('SELECT id, name FROM leave_types WHERE id = ?', [leaveTypeId]);
  if (!existing) {
    const error = new Error(`Leave policy #${leaveTypeId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  // Check references in leave_requests and used leave_balances
  const [reqCount] = await query('SELECT COUNT(*) AS count FROM leave_requests WHERE leave_type_id = ?', [leaveTypeId]);
  const [usedBalCount] = await query('SELECT COUNT(*) AS count FROM leave_balances WHERE leave_type_id = ? AND used_days > 0', [leaveTypeId]);

  const requests = Number(reqCount?.count || 0);
  const usedBalances = Number(usedBalCount?.count || 0);

  if (requests > 0 || usedBalances > 0) {
    const error = new Error(
      `Cannot delete leave policy "${existing.name}" because it is referenced in ${requests} leave request(s) and historical usage. Please deactivate the policy instead to preserve historical records.`
    );
    error.statusCode = 409;
    throw error;
  }

  // Clean up any unused auto-allocated quotas before deleting policy
  await query('DELETE FROM leave_balances WHERE leave_type_id = ? AND used_days = 0', [leaveTypeId]);
  await query('DELETE FROM leave_types WHERE id = ?', [leaveTypeId]);

  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'LEAVE_TYPE_DELETED', 'leave_type', ?, ?)`,
      [adminId, leaveTypeId, JSON.stringify({ name: existing.name })]
    );
  } catch (err) {}

  return {
    success: true,
    message: `Leave policy "${existing.name}" was successfully deleted.`,
  };
}

