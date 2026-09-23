import { query } from '../db/index.js';

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
