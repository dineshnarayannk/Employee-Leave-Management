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
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Enforce Admin-only access (role_id: 1) on all routes in this router
router.use(requireAuth);
router.use(requireRole(1));

// Dashboard metrics
router.get('/stats', handleGetDashboardStats);

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
