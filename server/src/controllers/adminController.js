import {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  userFilterQuerySchema,
} from '../validators/adminValidator.js';
import * as adminService from '../services/adminService.js';

/**
 * GET /api/admin/users
 */
export async function handleGetUsers(req, res) {
  try {
    const queryValidation = userFilterQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryValidation.error.errors.map((e) => e.message),
      });
    }

    const result = await adminService.getUsers(queryValidation.data);
    return res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve users',
    });
  }
}

/**
 * GET /api/admin/users/:id
 */
export async function handleGetUserById(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const user = await adminService.getUserById(userId);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve user details',
    });
  }
}

/**
 * POST /api/admin/users
 */
export async function handleCreateUser(req, res) {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const newUser = await adminService.createUser(parseResult.data, req.user.id);
    return res.status(201).json({
      success: true,
      message: `User "${newUser.name}" created successfully as ${newUser.role_name}.`,
      data: newUser,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to create user',
    });
  }
}

/**
 * PATCH /api/admin/users/:id
 */
export async function handleUpdateUser(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const updatedUser = await adminService.updateUser(userId, parseResult.data, req.user.id);
    return res.status(200).json({
      success: true,
      message: `User "${updatedUser.name}" updated successfully.`,
      data: updatedUser,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to update user',
    });
  }
}

/**
 * PATCH /api/admin/users/:id/status
 */
export async function handleUpdateUserStatus(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const updatedUser = await adminService.updateUserStatus(userId, parseResult.data.is_active, req.user.id);
    const actionLabel = updatedUser.is_active ? 'activated' : 'deactivated';
    return res.status(200).json({
      success: true,
      message: `User "${updatedUser.name}" has been ${actionLabel}.`,
      data: updatedUser,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to update user status',
    });
  }
}

/**
 * DELETE /api/admin/users/:id
 */
export async function handleDeleteUser(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const result = await adminService.deleteUser(userId, req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to delete user',
      reasons: err.reasons || undefined,
    });
  }
}

/**
 * GET /api/admin/managers
 */
export async function handleGetActiveManagers(req, res) {
  try {
    const managers = await adminService.getActiveManagers();
    return res.status(200).json({
      success: true,
      data: managers,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch active managers',
    });
  }
}

/**
 * GET /api/admin/stats
 */
export async function handleGetDashboardStats(req, res) {
  try {
    const stats = await adminService.getAdminDashboardStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch dashboard metrics',
    });
  }
}
