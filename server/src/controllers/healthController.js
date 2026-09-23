import { testConnection } from '../db/index.js';

/**
 * Server API Health Check
 * @route GET /api/health
 */
export function getHealthStatus(req, res) {
  res.status(200).json({
    success: true,
    message: 'Leave Management System API is running smoothly',
    timestamp: new Date().toISOString(),
    service: 'leave-management-server',
    status: 'healthy',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
}

/**
 * TiDB Database Connection Health Check
 * @route GET /api/health/db
 */
export async function getDbHealthStatus(req, res) {
  try {
    const result = await testConnection();

    if (!result.configured) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not configured',
        database: 'unconfigured',
        missing: result.missing,
        timestamp: new Date().toISOString(),
      });
    }

    if (!result.connected) {
      return res.status(503).json({
        success: false,
        message: 'Unable to establish database connection',
        database: 'disconnected',
        error: result.error,
        code: result.code,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
      database: 'connected',
      version: result.version,
      databaseName: result.database,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Unexpected error during database health check',
      database: 'error',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}
