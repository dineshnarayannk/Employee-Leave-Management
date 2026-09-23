import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  handleGetLeaveTypes,
  handleGetEmployeeBalances,
  handleApplyLeave,
  handleGetEmployeeRequests,
  handleGetEmployeeRequestById,
  handleCancelLeave,
  handleGetEmployeeStats,
  handleGetManagerRequests,
  handleGetManagerRequestById,
  handleApproveLeave,
  handleRejectLeave,
  handleGetTeamBalances,
  handleGetManagerStats,
  handleGetNotifications,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
} from '../controllers/leaveController.js';

const router = Router();

// ==============================================================================
// 1. PUBLIC / AUTHENTICATED COMMON ROUTES
// ==============================================================================

// Active leave types list (accessible by all authenticated users: Admin, Manager, Employee)
router.get('/leave-types', requireAuth, handleGetLeaveTypes);

// Notifications for current user
router.get('/notifications', requireAuth, handleGetNotifications);
router.patch('/notifications/:id/read', requireAuth, handleMarkNotificationRead);
router.patch('/notifications/read-all', requireAuth, handleMarkAllNotificationsRead);

// ==============================================================================
// 2. EMPLOYEE LEAVE ROUTES (role_id = 3)
// ==============================================================================

const employeeRouter = Router();
employeeRouter.use(requireRole(3));

employeeRouter.get('/leave-balances', handleGetEmployeeBalances);
employeeRouter.post('/leave-requests', handleApplyLeave);
employeeRouter.get('/leave-requests', handleGetEmployeeRequests);
employeeRouter.get('/leave-requests/:id', handleGetEmployeeRequestById);
employeeRouter.patch('/leave-requests/:id/cancel', handleCancelLeave);
employeeRouter.get('/stats', handleGetEmployeeStats);

// ==============================================================================
// 3. MANAGER LEAVE ROUTES (role_id = 2)
// ==============================================================================

const managerRouter = Router();
managerRouter.use(requireRole(2));

managerRouter.get('/leave-requests', handleGetManagerRequests);
managerRouter.get('/leave-requests/:id', handleGetManagerRequestById);
managerRouter.patch('/leave-requests/:id/approve', handleApproveLeave);
managerRouter.patch('/leave-requests/:id/reject', handleRejectLeave);
managerRouter.get('/team-balances', handleGetTeamBalances);
managerRouter.get('/stats', handleGetManagerStats);

export { router as leaveCommonRoutes, employeeRouter, managerRouter };
export default router;
