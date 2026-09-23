import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // TiDB Cloud / Database Configuration (supporting both DB_* and DATABASE_* prefixes)
  database: {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || '',
    port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT, 10) || 4000,
    user: process.env.DB_USER || process.env.DATABASE_USER || '',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    name: process.env.DB_NAME || process.env.DATABASE_NAME || '',
    sslCa: process.env.DB_SSL_CA || process.env.DATABASE_SSL_CA || '',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 0,
    waitForConnections: true,
  },

  // Google OAuth 2.0 (Client ID for ID token verification)
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },

  // Google Calendar Integration
  calendar: {
    apiKey: process.env.GOOGLE_CALENDAR_API_KEY || '',
    countryCode: process.env.DEFAULT_CALENDAR_COUNTRY || 'en.indian', // e.g. en.indian, en.usa
    companyCalendarId: process.env.GOOGLE_COMPANY_CALENDAR_ID || '',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-fallback-jwt-secret-key-32-chars-long!',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    cookieName: 'token',
  },

  // Session Secret (for future session-based workflows if needed)
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
};

/**
 * Validates database environment variables
 * @returns {{ isConfigured: boolean, missing: string[] }}
 */
export function validateDatabaseConfig() {
  const missing = [];
  if (!config.database.host) missing.push('DB_HOST (or DATABASE_HOST)');
  if (!config.database.user) missing.push('DB_USER (or DATABASE_USER)');
  if (!config.database.password) missing.push('DB_PASSWORD (or DATABASE_PASSWORD)');
  if (!config.database.name) missing.push('DB_NAME (or DATABASE_NAME)');

  return {
    isConfigured: missing.length === 0,
    missing,
  };
}

/**
 * Validates Google OAuth and JWT environment variables
 * @returns {{ isConfigured: boolean, missing: string[] }}
 */
export function validateAuthConfig() {
  const missing = [];
  if (!config.google.clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');

  return {
    isConfigured: missing.length === 0,
    missing,
  };
}

/**
 * Resolves SSL configuration for TiDB Cloud
 * @returns {object|undefined}
 */
export function getDbSslConfig() {
  const caPath = config.database.sslCa;
  if (caPath) {
    const resolvedPath = path.isAbsolute(caPath) ? caPath : path.resolve(process.cwd(), caPath);
    if (fs.existsSync(resolvedPath)) {
      return {
        ca: fs.readFileSync(resolvedPath),
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      };
    }
  }

  // TiDB Cloud default requires TLS / SSL
  return {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  };
}
