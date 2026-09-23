import { Router } from 'express';
import healthRoutes from './healthRoutes.js';

const apiRouter = Router();

// Health Check Route
apiRouter.use('/health', healthRoutes);

// Future Phase Routes (Placeholders ready for Phase 2 & 3)
// apiRouter.use('/auth', authRoutes);
// apiRouter.use('/users', userRoutes);
// apiRouter.use('/leaves', leaveRoutes);
// apiRouter.use('/admin', adminRoutes);

export default apiRouter;
