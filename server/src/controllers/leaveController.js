import {
  applyLeaveSchema,
  approveLeaveSchema,
  rejectLeaveSchema,
  leaveFilterQuerySchema,
  notificationFilterQuerySchema,
} from '../validators/leaveValidator.js';
import * as leaveService from '../services/leaveService.js';


/**
 * GET /api/leave-types
 * Accessible by any authenticated user
 */
export async function handleGetLeaveTypes(req, res) {
  try {
    const leaveTypes = await leaveService.getLeaveTypes();
    return res.status(200).json({
      success: true,
      data: leaveTypes,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve leave types',
    });
  }
}

/**
 * GET /api/employee/leave-balances
 * Accessible by Employees (or authenticated user for own balances)
 */
export async function handleGetEmployeeBalances(req, res) {
  try {
    const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    const balances = await leaveService.getEmployeeBalances(req.user.id, year);
    return res.status(200).json({
      success: true,
      data: balances,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve leave balances',
    });
  }
}

/**
 * POST /api/employee/leave-requests
 * Employee applies for leave
 */
export async function handleApplyLeave(req, res) {
  try {
    const parseResult = applyLeaveSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const newRequest = await leaveService.createLeaveRequest(req.user.id, parseResult.data);
    return res.status(201).json({
      success: true,
      message: `Leave request for ${newRequest.days} day(s) submitted successfully.`,
      data: newRequest,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to submit leave request',
    });
  }
}

/**
 * GET /api/employee/leave-requests
 * Employee retrieves their own requests
 */
export async function handleGetEmployeeRequests(req, res) {
  try {
    const queryValidation = leaveFilterQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryValidation.error.errors.map((e) => e.message),
      });
    }

    const result = await leaveService.getEmployeeRequests(req.user.id, queryValidation.data);
    return res.status(200).json({
      success: true,
      data: result.requests,
      pagination: result.pagination,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch leave requests',
    });
  }
}

/**
 * GET /api/employee/leave-requests/:id
 * Employee views specific leave request details
 */
export async function handleGetEmployeeRequestById(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid leave request ID' });
    }

    const requestDetails = await leaveService.getLeaveRequestById(requestId, req.user);
    return res.status(200).json({
      success: true,
      data: requestDetails,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve leave request details',
    });
  }
}

/**
 * PATCH /api/employee/leave-requests/:id/cancel
 * Employee cancels an eligible pending leave request
 */
export async function handleCancelLeave(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid leave request ID' });
    }

    const cancelledRequest = await leaveService.cancelLeaveRequest(requestId, req.user.id);
    return res.status(200).json({
      success: true,
      message: `Leave request #${requestId} was cancelled successfully.`,
      data: cancelledRequest,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to cancel leave request',
    });
  }
}

/**
 * GET /api/employee/stats
 * Employee dashboard metrics
 */
export async function handleGetEmployeeStats(req, res) {
  try {
    const stats = await leaveService.getEmployeeStats(req.user.id);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch employee dashboard metrics',
    });
  }
}

/**
 * GET /api/manager/leave-requests
 * Manager views pending/filtered requests from direct reports
 */
export async function handleGetManagerRequests(req, res) {
  try {
    const queryValidation = leaveFilterQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryValidation.error.errors.map((e) => e.message),
      });
    }

    const result = await leaveService.getManagerRequests(req.user.id, queryValidation.data);
    return res.status(200).json({
      success: true,
      data: result.requests,
      pagination: result.pagination,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch team leave requests',
    });
  }
}

/**
 * GET /api/manager/leave-requests/:id
 * Manager views specific request details
 */
export async function handleGetManagerRequestById(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid leave request ID' });
    }

    const requestDetails = await leaveService.getLeaveRequestById(requestId, req.user);
    return res.status(200).json({
      success: true,
      data: requestDetails,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve leave request details',
    });
  }
}

/**
 * PATCH /api/manager/leave-requests/:id/approve
 * Manager approves a pending request
 */
export async function handleApproveLeave(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid leave request ID' });
    }

    const parseResult = approveLeaveSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const approvedRequest = await leaveService.approveLeaveRequest(
      requestId,
      req.user.id,
      parseResult.data.response
    );

    return res.status(200).json({
      success: true,
      message: `Leave request #${requestId} has been APPROVED. Leave balances updated.`,
      data: approvedRequest,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to approve leave request',
    });
  }
}

/**
 * PATCH /api/manager/leave-requests/:id/reject
 * Manager rejects a pending request with mandatory reason
 */
export async function handleRejectLeave(req, res) {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid leave request ID' });
    }

    const parseResult = rejectLeaveSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const rejectedRequest = await leaveService.rejectLeaveRequest(
      requestId,
      req.user.id,
      parseResult.data.response
    );

    return res.status(200).json({
      success: true,
      message: `Leave request #${requestId} has been REJECTED.`,
      data: rejectedRequest,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to reject leave request',
    });
  }
}

/**
 * GET /api/manager/team-balances
 * Manager views balances of all direct reports
 */
export async function handleGetTeamBalances(req, res) {
  try {
    const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    const teamBalances = await leaveService.getTeamBalances(req.user.id, year);
    return res.status(200).json({
      success: true,
      data: teamBalances,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve team leave balances',
    });
  }
}

/**
 * GET /api/manager/stats
 * Manager dashboard metrics
 */
export async function handleGetManagerStats(req, res) {
  try {
    const stats = await leaveService.getManagerStats(req.user.id);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch manager dashboard metrics',
    });
  }
}

/**
 * GET /api/notifications
 */
export async function handleGetNotifications(req, res) {
  try {
    const queryValidation = notificationFilterQuerySchema.safeParse(req.query);
    const unreadOnly = queryValidation.success && queryValidation.data.unread !== undefined ? queryValidation.data.unread : false;
    const limit = queryValidation.success ? queryValidation.data.limit : 50;

    const notifications = await leaveService.getUserNotifications(req.user.id, {
      unreadOnly,
      limit,
    });
    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve notifications',
    });
  }
}

/**
 * PATCH /api/notifications/:id/read
 */
export async function handleMarkNotificationRead(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    await leaveService.markNotificationAsRead(id, req.user.id);
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to update notification',
    });
  }
}

/**
 * PATCH /api/notifications/read-all
 */
export async function handleMarkAllNotificationsRead(req, res) {
  try {
    await leaveService.markAllNotificationsAsRead(req.user.id);
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to mark all notifications as read',
    });
  }
}

/**
 * GET /api/manager/analytics (Step 7)
 */
export async function handleGetManagerAnalytics(req, res) {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const analytics = await leaveService.getManagerAnalytics(req.user.id, year);
    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve manager analytics',
    });
  }
}

/**
 * GET /api/manager/reports (Step 7)
 */
export async function handleGetManagerReports(req, res) {
  try {
    const reportData = await leaveService.getManagerReports(req.user.id, {
      year: req.query.year ? parseInt(req.query.year, 10) : undefined,
      status: req.query.status,
      leave_type_id: req.query.leave_type_id ? parseInt(req.query.leave_type_id, 10) : undefined,
      employee_id: req.query.employee_id ? parseInt(req.query.employee_id, 10) : undefined,
      search: req.query.search,
      page: req.query.page ? parseInt(req.query.page, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
    });

    return res.status(200).json({
      success: true,
      data: reportData.records,
      summary: reportData.summary,
      pagination: reportData.pagination,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to generate manager reports',
    });
  }
}

