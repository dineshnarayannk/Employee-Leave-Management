import { Router } from 'express';
import { getHealthStatus, getDbHealthStatus } from '../controllers/healthController.js';

const router = Router();

// GET /api/health -> Server status
router.get('/', getHealthStatus);

// GET /api/health/db -> TiDB Cloud database connection status
router.get('/db', getDbHealthStatus);

export default router;
