import { Router } from 'express';
import {
  handleGetUsers,
  handleGetUserById,
  handleCreateUser,
  handleUpdateUser,
  handleUpdateUserStatus,
  handleDeleteUser,
  handleGetActiveManagers,
  handleGetDashboardStats,
  handleGetAdminAnalytics,
  handleGetAdminReports,
  handleGetAdminLeaveTypes,
  handleCreateLeaveType,
  handleUpdateLeaveType,
  handleUpdateLeaveTypeStatus,
  handleDeleteLeaveType,
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Enforce Admin-only access (role_id: 1) on all routes in this router
router.use(requireAuth);
router.use(requireRole(1));

// Dashboard metrics & Analytics (Step 7)
router.get('/stats', handleGetDashboardStats);
router.get('/analytics', handleGetAdminAnalytics);

// Reports (Step 7)
router.get('/reports', handleGetAdminReports);

// Leave Policy Management (Step 7)
router.get('/leave-types', handleGetAdminLeaveTypes);
router.post('/leave-types', handleCreateLeaveType);
router.put('/leave-types/:id', handleUpdateLeaveType);
router.patch('/leave-types/:id', handleUpdateLeaveType);
router.patch('/leave-types/:id/status', handleUpdateLeaveTypeStatus);
router.delete('/leave-types/:id', handleDeleteLeaveType);

// Active managers list for assignment dropdowns
router.get('/managers', handleGetActiveManagers);

// User CRUD endpoints
router.get('/users', handleGetUsers);
router.get('/users/:id', handleGetUserById);
router.post('/users', handleCreateUser);
router.patch('/users/:id', handleUpdateUser);
router.patch('/users/:id/status', handleUpdateUserStatus);
router.delete('/users/:id', handleDeleteUser);

export default router;

