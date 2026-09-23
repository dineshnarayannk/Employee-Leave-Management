import mysql from 'mysql2/promise';
import { config, validateDatabaseConfig, getDbSslConfig } from '../config/env.js';

let pool = null;

/**
 * Creates or retrieves the MySQL / TiDB connection pool
 * @returns {mysql.Pool}
 */
export function getPool() {
  if (!pool) {
    const { isConfigured, missing } = validateDatabaseConfig();
    if (!isConfigured) {
      const err = new Error(
        `Database configuration is incomplete. Missing required variables: ${missing.join(', ')}`
      );
      err.code = 'ERR_DB_CONFIG_MISSING';
      throw err;
    }

    const sslConfig = getDbSslConfig();

    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      ssl: sslConfig,
      waitForConnections: config.database.waitForConnections,
      connectionLimit: config.database.connectionLimit,
      queueLimit: config.database.queueLimit,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }

  return pool;
}

/**
 * Execute a parameterized query
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<Array>}
 */
export async function query(sql, params = []) {
  const connectionPool = getPool();
  try {
    const [rows, fields] = await connectionPool.query(sql, params);
    return rows;
  } catch (error) {
    // Sanitize error to prevent leaking connection secrets
    const sanitizedError = new Error(error.message);
    sanitizedError.code = error.code;
    sanitizedError.errno = error.errno;
    sanitizedError.sqlState = error.sqlState;
    throw sanitizedError;
  }
}

/**
 * Obtains a single connection from the pool (for transactions)
 * @returns {Promise<mysql.PoolConnection>}
 */
export async function getConnection() {
  const connectionPool = getPool();
  return await connectionPool.getConnection();
}

/**
 * Tests database connectivity
 * @returns {Promise<{ connected: boolean, version?: string, error?: string, missing?: string[] }>}
 */
export async function testConnection() {
  const { isConfigured, missing } = validateDatabaseConfig();
  if (!isConfigured) {
    return {
      connected: false,
      configured: false,
      missing,
      error: `Database is not configured. Missing: ${missing.join(', ')}`,
    };
  }

  let connection;
  try {
    const connectionPool = getPool();
    connection = await connectionPool.getConnection();
    const [rows] = await connection.query('SELECT 1 AS alive, VERSION() AS version');
    
    return {
      connected: true,
      configured: true,
      version: rows[0]?.version || 'unknown',
      database: config.database.name,
      host: config.database.host,
    };
  } catch (error) {
    return {
      connected: false,
      configured: true,
      error: error.message,
      code: error.code || 'ERR_DB_CONNECTION_FAILED',
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Gracefully close the connection pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export const db = {
  getPool,
  query,
  getConnection,
  testConnection,
  closePool,
};

export default db;
