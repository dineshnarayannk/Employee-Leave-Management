import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import leaveCommonRoutes, { employeeRouter, managerRouter } from './leaveRoutes.js';
import calendarRoutes from './calendarRoutes.js';

const apiRouter = Router();

// Health Check Routes
apiRouter.use('/health', healthRoutes);

// Authentication Routes (Google OAuth + RBAC)
apiRouter.use('/auth', authRoutes);

// Admin Portal APIs (User Management & Stats)
apiRouter.use('/admin', adminRoutes);

// Calendar Service Routes (Google Calendar, Holidays & Sync)
apiRouter.use('/calendar', calendarRoutes);

// Leave Management Engine Routes
apiRouter.use('/', leaveCommonRoutes);
apiRouter.use('/employee', employeeRouter);
apiRouter.use('/manager', managerRouter);

export default apiRouter;


