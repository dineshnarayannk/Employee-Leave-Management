import { query, getConnection } from '../db/index.js';
import { calculateInclusiveDays, formatISODate, getYearFromDate } from '../utils/dateUtils.js';

/**
 * Fetch all active leave types
 */
export async function getLeaveTypes() {
  const sql = `
    SELECT id, name, description, default_days, is_active
    FROM leave_types
    WHERE is_active = TRUE
    ORDER BY id ASC
  `;
  return await query(sql);
}

/**
 * Ensures that leave_balances records exist for the given employee and year.
 * If missing, initializes rows with allocated_days = default_days, used_days = 0, remaining_days = default_days.
 *
 * @param {number} employeeId
 * @param {number} year
 * @param {object} [connection] Optional active connection for transactions
 */
export async function ensureEmployeeBalances(employeeId, year, connection = null) {
  const executeQuery = connection
    ? (sql, params) => connection.query(sql, params).then(([rows]) => rows)
    : query;

  // 1. Get all active leave types
  const leaveTypes = await executeQuery(
    'SELECT id, default_days FROM leave_types WHERE is_active = TRUE'
  );

  for (const lt of leaveTypes) {
    // Insert if not already exists for this employee, leave_type, and year
    await executeQuery(
      `INSERT INTO leave_balances (employee_id, leave_type_id, allocated_days, used_days, remaining_days, year)
       VALUES (?, ?, ?, 0.00, ?, ?)
       ON DUPLICATE KEY UPDATE allocated_days = allocated_days`,
      [employeeId, lt.id, lt.default_days, lt.default_days, year]
    );
  }
}

/**
 * Fetch employee leave balances for a specific year
 */
export async function getEmployeeBalances(employeeId, year = new Date().getFullYear()) {
  const numericYear = Number(year) || new Date().getFullYear();

  // Ensure balance rows exist
  await ensureEmployeeBalances(employeeId, numericYear);

  const sql = `
    SELECT 
      lb.id,
      lb.employee_id,
      lb.leave_type_id,
      lt.name AS leave_type_name,
      lt.description AS leave_type_description,
      lt.default_days,
      CAST(lb.allocated_days AS DOUBLE) AS allocated_days,
      CAST(lb.used_days AS DOUBLE) AS used_days,
      CAST(lb.remaining_days AS DOUBLE) AS remaining_days,
      lb.year,
      lb.created_at,
      lb.updated_at
    FROM leave_balances lb
    JOIN leave_types lt ON lb.leave_type_id = lt.id
    WHERE lb.employee_id = ? AND lb.year = ? AND lt.is_active = TRUE
    ORDER BY lt.id ASC
  `;

  const rows = await query(sql, [employeeId, numericYear]);
  return rows;
}

/**
 * Create a new Leave Request (Employee)
 */
export async function createLeaveRequest(employeeId, data) {
  const { leave_type_id, start_date, end_date, reason } = data;

  // 1. Verify employee exists and is active
  const [employee] = await query(
    'SELECT id, name, email, manager_id, is_active FROM users WHERE id = ?',
    [employeeId]
  );

  if (!employee || !employee.is_active) {
    const error = new Error('Employee account is inactive or not found.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Verify assigned manager exists and is active
  if (!employee.manager_id) {
    const error = new Error(
      'You do not have an active manager assigned. Please contact the administrator to assign a manager before applying for leave.'
    );
    error.statusCode = 400;
    throw error;
  }

  const [manager] = await query(
    'SELECT id, name, email, is_active FROM users WHERE id = ?',
    [employee.manager_id]
  );

  if (!manager || !manager.is_active) {
    const error = new Error(
      'Your assigned manager account is currently inactive or not found. Please contact the administrator.'
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify selected leave type is active
  const [leaveType] = await query(
    'SELECT id, name, is_active FROM leave_types WHERE id = ?',
    [leave_type_id]
  );

  if (!leaveType || !leaveType.is_active) {
    const error = new Error('The selected leave type is invalid or inactive.');
    error.statusCode = 400;
    throw error;
  }

  // 4. Calculate inclusive duration
  const durationDays = calculateInclusiveDays(start_date, end_date);
  const leaveYear = getYearFromDate(start_date);
  const formattedStart = formatISODate(start_date);
  const formattedEnd = formatISODate(end_date);

  // 5. Check for overlapping active (PENDING or APPROVED) leave requests
  const overlapSql = `
    SELECT id, start_date, end_date, status 
    FROM leave_requests 
    WHERE employee_id = ? 
      AND status IN ('PENDING', 'APPROVED')
      AND start_date <= ? 
      AND end_date >= ?
    LIMIT 1
  `;
  const overlapping = await query(overlapSql, [employeeId, formattedEnd, formattedStart]);

  if (overlapping && overlapping.length > 0) {
    const match = overlapping[0];
    const matchStart = formatISODate(match.start_date);
    const matchEnd = formatISODate(match.end_date);
    const error = new Error(
      `You already have an existing ${match.status} leave request (#${match.id}) overlapping this period (${matchStart} to ${matchEnd}).`
    );
    error.statusCode = 400;
    throw error;
  }

  // 6. Check employee's leave balance for that year
  await ensureEmployeeBalances(employeeId, leaveYear);

  const [balance] = await query(
    'SELECT allocated_days, used_days, remaining_days FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?',
    [employeeId, leave_type_id, leaveYear]
  );

  const remaining = balance ? Number(balance.remaining_days) : 0;
  if (remaining < durationDays) {
    const error = new Error(
      `Insufficient leave balance. You have ${remaining} day(s) remaining for "${leaveType.name}", but your request requires ${durationDays} day(s).`
    );
    error.statusCode = 400;
    throw error;
  }

  // 7. Insert the Leave Request with status PENDING
  const insertSql = `
    INSERT INTO leave_requests (employee_id, manager_id, leave_type_id, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
  `;

  const insertResult = await query(insertSql, [
    employeeId,
    employee.manager_id,
    leave_type_id,
    formattedStart,
    formattedEnd,
    reason.trim(),
  ]);

  const requestId = insertResult.insertId;

  // 8. Create notification for the manager
  try {
    const notifMsg = `New leave request (#${requestId}) submitted by ${employee.name} for ${durationDays} day(s) (${formattedStart} to ${formattedEnd}).`;
    await query(
      'INSERT INTO notifications (user_id, leave_request_id, message) VALUES (?, ?, ?)',
      [employee.manager_id, requestId, notifMsg]
    );
  } catch (notifErr) {
    console.error('Warning: Failed to create manager notification:', notifErr.message);
  }

  // 9. Create audit log
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'LEAVE_REQUEST_CREATED', 'leave_request', ?, ?)`,
      [
        employeeId,
        requestId,
        JSON.stringify({
          leave_type_id,
          leave_type_name: leaveType.name,
          start_date: formattedStart,
          end_date: formattedEnd,
          days: durationDays,
          manager_id: employee.manager_id,
        }),
      ]
    );
  } catch (auditErr) {
    console.error('Warning: Failed to create audit log for leave request:', auditErr.message);
  }

  return await getLeaveRequestById(requestId, { id: employeeId, role_id: 3 });
}

/**
 * Fetch detailed leave request by ID with role-based authorization
 */
export async function getLeaveRequestById(requestId, user) {
  const sql = `
    SELECT 
      lr.id,
      lr.employee_id,
      u.name AS employee_name,
      u.email AS employee_email,
      u.department AS employee_department,
      lr.manager_id,
      m.name AS manager_name,
      m.email AS manager_email,
      lr.leave_type_id,
      lt.name AS leave_type_name,
      lt.description AS leave_type_description,
      lr.start_date,
      lr.end_date,
      lr.reason,
      lr.status,
      lr.manager_response,
      lr.reviewed_by,
      rev.name AS reviewer_name,
      lr.reviewed_at,
      lr.created_at,
      lr.updated_at
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    JOIN users m ON lr.manager_id = m.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    LEFT JOIN users rev ON lr.reviewed_by = rev.id
    WHERE lr.id = ?
    LIMIT 1
  `;

  const rows = await query(sql, [requestId]);
  if (!rows || rows.length === 0) {
    const error = new Error(`Leave request #${requestId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  const req = rows[0];

  // Format dates
  const formattedStart = formatISODate(req.start_date);
  const formattedEnd = formatISODate(req.end_date);
  const duration = calculateInclusiveDays(formattedStart, formattedEnd);

  const formattedRequest = {
    id: req.id,
    employee_id: req.employee_id,
    employee_name: req.employee_name,
    employee_email: req.employee_email,
    employee_department: req.employee_department,
    manager_id: req.manager_id,
    manager_name: req.manager_name,
    manager_email: req.manager_email,
    leave_type_id: req.leave_type_id,
    leave_type_name: req.leave_type_name,
    leave_type_description: req.leave_type_description,
    start_date: formattedStart,
    end_date: formattedEnd,
    days: duration,
    reason: req.reason,
    status: req.status,
    manager_response: req.manager_response,
    reviewed_by: req.reviewed_by,
    reviewer_name: req.reviewer_name,
    reviewed_at: req.reviewed_at,
    created_at: req.created_at,
    updated_at: req.updated_at,
  };

  // Enforce Authorization:
  // - Admin (1): Can view any request
  // - Manager (2): Can view if manager_id === user.id
  // - Employee (3): Can view only if employee_id === user.id
  if (user) {
    if (user.role_id === 3 && Number(req.employee_id) !== Number(user.id)) {
      const error = new Error('Access denied. You can only view your own leave requests.');
      error.statusCode = 403;
      throw error;
    }
    if (user.role_id === 2 && Number(req.manager_id) !== Number(user.id)) {
      const error = new Error('Access denied. You can only view leave requests from your assigned team members.');
      error.statusCode = 403;
      throw error;
    }
  }

  return formattedRequest;
}

/**
 * Fetch paginated leave requests for an Employee with search, month, and year filters
 */
export async function getEmployeeRequests(
  employeeId,
  { status, leave_type_id, year, month, search, page = 1, limit = 10 }
) {
  const whereClauses = ['lr.employee_id = ?'];
  const params = [employeeId];

  if (status) {
    whereClauses.push('lr.status = ?');
    params.push(status);
  }

  if (leave_type_id) {
    whereClauses.push('lr.leave_type_id = ?');
    params.push(leave_type_id);
  }

  let filterYear = year;
  let filterMonth = month;
  if (typeof month === 'string' && month.includes('-')) {
    const parts = month.split('-');
    filterYear = parseInt(parts[0], 10);
    filterMonth = parseInt(parts[1], 10);
  }

  if (filterYear && filterMonth) {
    whereClauses.push('( (YEAR(lr.start_date) = ? AND MONTH(lr.start_date) = ?) OR (YEAR(lr.end_date) = ? AND MONTH(lr.end_date) = ?) OR (lr.start_date <= LAST_DAY(CONCAT(?, "-", LPAD(?, 2, "00"), "-01")) AND lr.end_date >= CONCAT(?, "-", LPAD(?, 2, "00"), "-01")) )');
    params.push(filterYear, filterMonth, filterYear, filterMonth, filterYear, filterMonth, filterYear, filterMonth);
  } else if (filterMonth) {
    whereClauses.push('(MONTH(lr.start_date) = ? OR MONTH(lr.end_date) = ?)');
    params.push(filterMonth, filterMonth);
  } else if (filterYear) {
    whereClauses.push('(YEAR(lr.start_date) = ? OR YEAR(lr.end_date) = ?)');
    params.push(filterYear, filterYear);
  }

  if (search) {
    whereClauses.push('(lr.reason LIKE ? OR lt.name LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  // Count total matching
  const countSql = `
    SELECT COUNT(*) AS total 
    FROM leave_requests lr 
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    ${whereSql}
  `;
  const countResult = await query(countSql, params);
  const total = Number(countResult[0]?.total || 0);

  // Paginated query
  const offset = (page - 1) * limit;
  const dataSql = `
    SELECT 
      lr.id,
      lr.employee_id,
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
    JOIN users m ON lr.manager_id = m.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    ${whereSql}
    ORDER BY lr.start_date DESC, lr.id DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await query(dataSql, [...params, limit, offset]);

  const requests = rows.map((r) => {
    const formattedStart = formatISODate(r.start_date);
    const formattedEnd = formatISODate(r.end_date);
    return {
      id: r.id,
      employee_id: r.employee_id,
      manager_id: r.manager_id,
      manager_name: r.manager_name,
      leave_type_id: r.leave_type_id,
      leave_type_name: r.leave_type_name,
      start_date: formattedStart,
      end_date: formattedEnd,
      days: calculateInclusiveDays(formattedStart, formattedEnd),
      reason: r.reason,
      status: r.status,
      manager_response: r.manager_response,
      reviewed_at: r.reviewed_at,
      created_at: r.created_at,
    };
  });

  return {
    requests,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Cancel a pending Leave Request (Employee)
 */
export async function cancelLeaveRequest(requestId, employeeId) {
  // 1. Fetch current status to return specific errors if not cancellable
  const [existing] = await query(
    'SELECT id, employee_id, manager_id, status, start_date, end_date FROM leave_requests WHERE id = ?',
    [requestId]
  );

  if (!existing) {
    const error = new Error(`Leave request #${requestId} not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (Number(existing.employee_id) !== Number(employeeId)) {
    const error = new Error('You can only cancel your own leave requests.');
    error.statusCode = 403;
    throw error;
  }

  if (existing.status !== 'PENDING') {
    const error = new Error(
      `Cannot cancel request. Only PENDING requests can be cancelled. Current status is ${existing.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 2. Conditional status update
  const updateSql = `
    UPDATE leave_requests 
    SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND employee_id = ? AND status = 'PENDING'
  `;

  const result = await query(updateSql, [requestId, employeeId]);

  if (result.affectedRows === 0) {
    const error = new Error('Leave request could not be cancelled. Status may have changed concurrently.');
    error.statusCode = 409;
    throw error;
  }

  // 3. Notify manager
  try {
    const [employee] = await query('SELECT name FROM users WHERE id = ?', [employeeId]);
    const empName = employee?.name || 'Employee';
    const notifMsg = `${empName} cancelled their pending leave request (#${requestId}) for ${formatISODate(existing.start_date)} to ${formatISODate(existing.end_date)}.`;
    await query(
      'INSERT INTO notifications (user_id, leave_request_id, message) VALUES (?, ?, ?)',
      [existing.manager_id, requestId, notifMsg]
    );
  } catch (notifErr) {
    console.error('Warning: Failed to create manager cancellation notification:', notifErr.message);
  }

  // 4. Audit log
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'LEAVE_REQUEST_CANCELLED', 'leave_request', ?, ?)`,
      [employeeId, requestId, JSON.stringify({ previousStatus: 'PENDING', newStatus: 'CANCELLED' })]
    );
  } catch (auditErr) {
    console.error('Warning: Failed to create audit log for cancellation:', auditErr.message);
  }

  return await getLeaveRequestById(requestId, { id: employeeId, role_id: 3 });
}

/**
 * Fetch paginated leave requests for a Manager with search, employee_id, month, and year filters
 */
export async function getManagerRequests(
  managerId,
  { status, leave_type_id, employee_id, year, month, search, page = 1, limit = 10 }
) {
  const whereClauses = ['lr.manager_id = ?'];
  const params = [managerId];

  if (status) {
    whereClauses.push('lr.status = ?');
    params.push(status);
  }

  if (leave_type_id) {
    whereClauses.push('lr.leave_type_id = ?');
    params.push(leave_type_id);
  }

  if (employee_id) {
    whereClauses.push('lr.employee_id = ?');
    params.push(employee_id);
  }

  let filterYear = year;
  let filterMonth = month;
  if (typeof month === 'string' && month.includes('-')) {
    const parts = month.split('-');
    filterYear = parseInt(parts[0], 10);
    filterMonth = parseInt(parts[1], 10);
  }

  if (filterYear && filterMonth) {
    whereClauses.push('( (YEAR(lr.start_date) = ? AND MONTH(lr.start_date) = ?) OR (YEAR(lr.end_date) = ? AND MONTH(lr.end_date) = ?) OR (lr.start_date <= LAST_DAY(CONCAT(?, "-", LPAD(?, 2, "00"), "-01")) AND lr.end_date >= CONCAT(?, "-", LPAD(?, 2, "00"), "-01")) )');
    params.push(filterYear, filterMonth, filterYear, filterMonth, filterYear, filterMonth, filterYear, filterMonth);
  } else if (filterMonth) {
    whereClauses.push('(MONTH(lr.start_date) = ? OR MONTH(lr.end_date) = ?)');
    params.push(filterMonth, filterMonth);
  } else if (filterYear) {
    whereClauses.push('(YEAR(lr.start_date) = ? OR YEAR(lr.end_date) = ?)');
    params.push(filterYear, filterYear);
  }

  if (search) {
    whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR lr.reason LIKE ? OR lt.name LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  // Count total matching
  const countSql = `
    SELECT COUNT(*) AS total 
    FROM leave_requests lr 
    JOIN users u ON lr.employee_id = u.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    ${whereSql}
  `;
  const countResult = await query(countSql, params);
  const total = Number(countResult[0]?.total || 0);

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
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    ${whereSql}
    ORDER BY 
      CASE WHEN lr.status = 'PENDING' THEN 0 ELSE 1 END,
      lr.start_date DESC,
      lr.id DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await query(dataSql, [...params, limit, offset]);

  const requests = rows.map((r) => {
    const formattedStart = formatISODate(r.start_date);
    const formattedEnd = formatISODate(r.end_date);
    return {
      id: r.id,
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      employee_email: r.employee_email,
      employee_department: r.employee_department,
      manager_id: r.manager_id,
      leave_type_id: r.leave_type_id,
      leave_type_name: r.leave_type_name,
      start_date: formattedStart,
      end_date: formattedEnd,
      days: calculateInclusiveDays(formattedStart, formattedEnd),
      reason: r.reason,
      status: r.status,
      manager_response: r.manager_response,
      reviewed_at: r.reviewed_at,
      created_at: r.created_at,
    };
  });

  return {
    requests,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Approve a pending Leave Request (Manager)
 * Executes atomic transaction with balance deduction, locks, and audits.
 */
export async function approveLeaveRequest(requestId, managerId, responseText = '') {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch and Lock Leave Request
    const [requestRows] = await connection.query(
      `SELECT lr.*, u.name AS employee_name, lt.name AS leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.employee_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = ?
       FOR UPDATE`,
      [requestId]
    );

    if (!requestRows || requestRows.length === 0) {
      const error = new Error(`Leave request #${requestId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const leaveReq = requestRows[0];

    // 2. Authorization check: Manager must match
    if (Number(leaveReq.manager_id) !== Number(managerId)) {
      const error = new Error('Access denied. You are not authorized to review leave requests for this employee.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Status check: Must be PENDING
    if (leaveReq.status !== 'PENDING') {
      const error = new Error(
        `Leave request #${requestId} has already been ${leaveReq.status.toLowerCase()} and cannot be approved.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 4. Calculate duration and year
    const formattedStart = formatISODate(leaveReq.start_date);
    const formattedEnd = formatISODate(leaveReq.end_date);
    const durationDays = calculateInclusiveDays(formattedStart, formattedEnd);
    const leaveYear = getYearFromDate(formattedStart);

    // 5. Ensure balance row exists inside transaction
    await ensureEmployeeBalances(leaveReq.employee_id, leaveYear, connection);

    // 6. Lock and fetch Leave Balance row
    const [balanceRows] = await connection.query(
      `SELECT id, allocated_days, used_days, remaining_days 
       FROM leave_balances 
       WHERE employee_id = ? AND leave_type_id = ? AND year = ?
       FOR UPDATE`,
      [leaveReq.employee_id, leaveReq.leave_type_id, leaveYear]
    );

    if (!balanceRows || balanceRows.length === 0) {
      const error = new Error('Leave balance record not found for this employee.');
      error.statusCode = 400;
      throw error;
    }

    const balance = balanceRows[0];
    const remainingDays = Number(balance.remaining_days);

    if (remainingDays < durationDays) {
      const error = new Error(
        `Cannot approve: Employee has only ${remainingDays} day(s) remaining for "${leaveReq.leave_type_name}", but this request requires ${durationDays} day(s).`
      );
      error.statusCode = 400;
      throw error;
    }

    // 7. Update Leave Request to APPROVED
    const [updateReqResult] = await connection.query(
      `UPDATE leave_requests 
       SET status = 'APPROVED', 
           manager_response = ?, 
           reviewed_by = ?, 
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'PENDING'`,
      [responseText?.trim() || null, managerId, requestId]
    );

    if (updateReqResult.affectedRows === 0) {
      const error = new Error('Leave request status conflict. The request was already reviewed by another process.');
      error.statusCode = 409;
      throw error;
    }

    // 8. Deduct Leave Balance atomically
    const newUsedDays = Number(balance.used_days) + durationDays;
    const newRemainingDays = Number(balance.remaining_days) - durationDays;

    await connection.query(
      `UPDATE leave_balances 
       SET used_days = ?, remaining_days = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newUsedDays, newRemainingDays, balance.id]
    );

    // 9. Create notification for employee
    const [manager] = await connection.query('SELECT name FROM users WHERE id = ?', [managerId]);
    const managerName = manager[0]?.name || 'Manager';
    const notifMsg = `Your leave request (#${requestId}) for ${durationDays} day(s) (${formattedStart} to ${formattedEnd}) has been APPROVED by ${managerName}.${responseText ? ` Note: "${responseText.trim()}"` : ''}`;

    await connection.query(
      'INSERT INTO notifications (user_id, leave_request_id, message) VALUES (?, ?, ?)',
      [leaveReq.employee_id, requestId, notifMsg]
    );

    // 10. Create audit logs
    await connection.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'LEAVE_REQUEST_APPROVED', 'leave_request', ?, ?)`,
      [
        managerId,
        requestId,
        JSON.stringify({
          employee_id: leaveReq.employee_id,
          leave_type_id: leaveReq.leave_type_id,
          days: durationDays,
          allocated_days: Number(balance.allocated_days),
          previous_used_days: Number(balance.used_days),
          new_used_days: newUsedDays,
          new_remaining_days: newRemainingDays,
          manager_response: responseText?.trim() || null,
        }),
      ]
    );

    await connection.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'LEAVE_BALANCE_UPDATED', 'leave_balance', ?, ?)`,
      [
        managerId,
        balance.id,
        JSON.stringify({
          employee_id: leaveReq.employee_id,
          leave_type_id: leaveReq.leave_type_id,
          year: leaveYear,
          deducted_days: durationDays,
          remaining_days: newRemainingDays,
          reason: `Leave Request #${requestId} Approved`,
        }),
      ]
    );

    await connection.commit();

    return await getLeaveRequestById(requestId, { id: managerId, role_id: 2 });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Reject a pending Leave Request (Manager)
 * Updates status to REJECTED, stores manager reason, leaves balances untouched.
 */
export async function rejectLeaveRequest(requestId, managerId, responseText) {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch and Lock Leave Request
    const [requestRows] = await connection.query(
      `SELECT lr.*, u.name AS employee_name, lt.name AS leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.employee_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = ?
       FOR UPDATE`,
      [requestId]
    );

    if (!requestRows || requestRows.length === 0) {
      const error = new Error(`Leave request #${requestId} not found.`);
      error.statusCode = 404;
      throw error;
    }

    const leaveReq = requestRows[0];

    // 2. Authorization check
    if (Number(leaveReq.manager_id) !== Number(managerId)) {
      const error = new Error('Access denied. You are not authorized to review leave requests for this employee.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Status check: Must be PENDING
    if (leaveReq.status !== 'PENDING') {
      const error = new Error(
        `Leave request #${requestId} has already been ${leaveReq.status.toLowerCase()} and cannot be reviewed.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 4. Update status to REJECTED
    const [updateResult] = await connection.query(
      `UPDATE leave_requests 
       SET status = 'REJECTED', 
           manager_response = ?, 
           reviewed_by = ?, 
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'PENDING'`,
      [responseText.trim(), managerId, requestId]
    );

    if (updateResult.affectedRows === 0) {
      const error = new Error('Leave request status conflict. The request was already reviewed by another process.');
      error.statusCode = 409;
      throw error;
    }

    // 5. Create notification for employee
    const [manager] = await connection.query('SELECT name FROM users WHERE id = ?', [managerId]);
    const managerName = manager[0]?.name || 'Manager';
    const notifMsg = `Your leave request (#${requestId}) was REJECTED by ${managerName}. Reason: "${responseText.trim()}"`;

    await connection.query(
      'INSERT INTO notifications (user_id, leave_request_id, message) VALUES (?, ?, ?)',
      [leaveReq.employee_id, requestId, notifMsg]
    );

    // 6. Create audit log
    await connection.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'LEAVE_REQUEST_REJECTED', 'leave_request', ?, ?)`,
      [
        managerId,
        requestId,
        JSON.stringify({
          employee_id: leaveReq.employee_id,
          leave_type_id: leaveReq.leave_type_id,
          manager_response: responseText.trim(),
        }),
      ]
    );

    await connection.commit();

    return await getLeaveRequestById(requestId, { id: managerId, role_id: 2 });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Fetch team members' leave balances for a Manager
 */
export async function getTeamBalances(managerId, year = new Date().getFullYear()) {
  const numericYear = Number(year) || new Date().getFullYear();

  // 1. Get all active direct reports
  const teamMembers = await query(
    `SELECT id, name, email, department 
     FROM users 
     WHERE manager_id = ? AND is_active = TRUE 
     ORDER BY name ASC`,
    [managerId]
  );

  if (!teamMembers || teamMembers.length === 0) {
    return [];
  }

  // 2. Ensure balances for each team member
  for (const emp of teamMembers) {
    await ensureEmployeeBalances(emp.id, numericYear);
  }

  // 3. Fetch all balances for team members
  const memberIds = teamMembers.map((m) => m.id);
  const placeholders = memberIds.map(() => '?').join(',');

  const balancesSql = `
    SELECT 
      lb.id,
      lb.employee_id,
      u.name AS employee_name,
      u.email AS employee_email,
      u.department AS employee_department,
      lb.leave_type_id,
      lt.name AS leave_type_name,
      CAST(lb.allocated_days AS DOUBLE) AS allocated_days,
      CAST(lb.used_days AS DOUBLE) AS used_days,
      CAST(lb.remaining_days AS DOUBLE) AS remaining_days,
      lb.year
    FROM leave_balances lb
    JOIN users u ON lb.employee_id = u.id
    JOIN leave_types lt ON lb.leave_type_id = lt.id
    WHERE lb.employee_id IN (${placeholders}) AND lb.year = ? AND lt.is_active = TRUE
    ORDER BY u.name ASC, lt.id ASC
  `;

  const balanceRows = await query(balancesSql, [...memberIds, numericYear]);

  // Group balances by team member
  const memberMap = new Map();
  teamMembers.forEach((m) => {
    memberMap.set(m.id, {
      id: m.id,
      name: m.name,
      email: m.email,
      department: m.department,
      balances: [],
    });
  });

  balanceRows.forEach((row) => {
    const member = memberMap.get(row.employee_id);
    if (member) {
      member.balances.push({
        id: row.id,
        leave_type_id: row.leave_type_id,
        leave_type_name: row.leave_type_name,
        allocated_days: row.allocated_days,
        used_days: row.used_days,
        remaining_days: row.remaining_days,
      });
    }
  });

  return Array.from(memberMap.values());
}

/**
 * Fetch Manager overview statistics and upcoming team leaves
 */
export async function getManagerStats(managerId) {
  const [directReports] = await query(
    'SELECT COUNT(*) AS count FROM users WHERE manager_id = ? AND is_active = TRUE',
    [managerId]
  );
  const [pendingRequests] = await query(
    "SELECT COUNT(*) AS count FROM leave_requests WHERE manager_id = ? AND status = 'PENDING'",
    [managerId]
  );
  const [approvedThisMonth] = await query(
    `SELECT COUNT(*) AS count FROM leave_requests 
     WHERE manager_id = ? AND status = 'APPROVED' 
       AND MONTH(reviewed_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(reviewed_at) = YEAR(CURRENT_DATE())`,
    [managerId]
  );
  const [rejectedThisMonth] = await query(
    `SELECT COUNT(*) AS count FROM leave_requests 
     WHERE manager_id = ? AND status = 'REJECTED' 
       AND MONTH(reviewed_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(reviewed_at) = YEAR(CURRENT_DATE())`,
    [managerId]
  );

  // Fetch upcoming approved leaves for team
  const upcomingSql = `
    SELECT 
      lr.id,
      lr.employee_id,
      u.name AS employee_name,
      u.email AS employee_email,
      u.department AS employee_department,
      lt.name AS leave_type_name,
      lr.start_date,
      lr.end_date,
      lr.reason,
      lr.status
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE lr.manager_id = ? 
      AND lr.status = 'APPROVED'
      AND lr.end_date >= CURRENT_DATE()
    ORDER BY lr.start_date ASC
    LIMIT 5
  `;
  const upcomingRows = await query(upcomingSql, [managerId]);
  const upcomingLeaves = upcomingRows.map((r) => {
    const s = formatISODate(r.start_date);
    const e = formatISODate(r.end_date);
    return {
      ...r,
      start_date: s,
      end_date: e,
      days: calculateInclusiveDays(s, e),
    };
  });

  return {
    directReportsCount: Number(directReports?.count || 0),
    pendingRequestsCount: Number(pendingRequests?.count || 0),
    approvedThisMonthCount: Number(approvedThisMonth?.count || 0),
    rejectedThisMonthCount: Number(rejectedThisMonth?.count || 0),
    upcomingLeaves,
    upcomingTeamLeaves: upcomingLeaves,
  };
}

/**
 * Fetch Employee overview statistics and upcoming approved leaves
 */
export async function getEmployeeStats(employeeId) {
  const [pending] = await query(
    "SELECT COUNT(*) AS count FROM leave_requests WHERE employee_id = ? AND status = 'PENDING'",
    [employeeId]
  );
  const [approved] = await query(
    "SELECT COUNT(*) AS count FROM leave_requests WHERE employee_id = ? AND status = 'APPROVED'",
    [employeeId]
  );
  const [rejected] = await query(
    "SELECT COUNT(*) AS count FROM leave_requests WHERE employee_id = ? AND status = 'REJECTED'",
    [employeeId]
  );

  const currentYear = new Date().getFullYear();
  await ensureEmployeeBalances(employeeId, currentYear);

  const [totalRemaining] = await query(
    'SELECT SUM(remaining_days) AS total FROM leave_balances WHERE employee_id = ? AND year = ?',
    [employeeId, currentYear]
  );

  // Fetch upcoming approved leaves for employee
  const upcomingSql = `
    SELECT 
      lr.id,
      lr.leave_type_id,
      lt.name AS leave_type_name,
      lr.start_date,
      lr.end_date,
      lr.reason,
      lr.status
    FROM leave_requests lr
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE lr.employee_id = ? 
      AND lr.status = 'APPROVED'
      AND lr.end_date >= CURRENT_DATE()
    ORDER BY lr.start_date ASC
    LIMIT 5
  `;
  const upcomingRows = await query(upcomingSql, [employeeId]);
  const upcomingLeaves = upcomingRows.map((r) => {
    const s = formatISODate(r.start_date);
    const e = formatISODate(r.end_date);
    return {
      ...r,
      start_date: s,
      end_date: e,
      days: calculateInclusiveDays(s, e),
    };
  });

  const pCount = Number(pending?.count || 0);
  const aCount = Number(approved?.count || 0);
  const rCount = Number(rejected?.count || 0);

  const [totalCountRow] = await query(
    'SELECT COUNT(*) AS total FROM leave_requests WHERE employee_id = ?',
    [employeeId]
  );

  return {
    totalRequests: Number(totalCountRow?.total || (pCount + aCount + rCount)),
    pendingRequestsCount: pCount,
    approvedRequestsCount: aCount,
    rejectedRequestsCount: rCount,
    totalRemainingDays: Number(totalRemaining?.total || 0),
    upcomingLeaves,
  };
}

/**
 * Fetch user notifications with unread filtering
 */
export async function getUserNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
  const whereClauses = ['user_id = ?'];
  const params = [userId];

  if (unreadOnly) {
    whereClauses.push('is_read = FALSE');
  }

  const sql = `
    SELECT id, leave_request_id, message, is_read, created_at
    FROM notifications
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `;
  const rows = await query(sql, [...params, limit]);
  return rows.map((r) => ({
    ...r,
    is_read: Boolean(r.is_read),
  }));
}

/**
 * Mark a single notification as read (with strict ownership check)
 */
export async function markNotificationAsRead(notificationId, userId) {
  const result = await query(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );

  if (result.affectedRows === 0) {
    const [exists] = await query('SELECT id, user_id FROM notifications WHERE id = ?', [
      notificationId,
    ]);
    if (!exists) {
      const error = new Error(`Notification #${notificationId} not found.`);
      error.statusCode = 404;
      throw error;
    }
    const error = new Error('Access denied. You cannot modify notifications belonging to another user.');
    error.statusCode = 403;
    throw error;
  }

  return { success: true, message: 'Notification marked as read.' };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId) {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [
    userId,
  ]);
  return { success: true, message: 'All notifications marked as read.' };
}
