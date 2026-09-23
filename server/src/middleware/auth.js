import { verifyToken } from '../utils/jwt.js';
import { getUserById } from '../services/authService.js';
import { config } from '../config/env.js';

/**
 * Authentication Middleware: Validates JWT token from HTTP-only cookie or Authorization header
 */
export async function requireAuth(req, res, next) {
  try {
    // 1. Extract token from cookie or Authorization header
    let token = req.cookies?.[config.jwt.cookieName];

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
      });
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authentication token.',
      });
    }

    // 3. Fetch current user from database to verify active status and actual role
    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or has been removed.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact the administrator.',
      });
    }

    // 4. Attach verified user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication verification encountered an internal error.',
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware: Restricts route to specific role_id values
 * @param  {...number} allowedRoles - Role IDs (e.g. 1=Admin, 2=Manager, 3=Employee)
 */
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    // Ensure authentication has run
    if (!req.user) {
      return requireAuth(req, res, () => {
        checkRole(req, res, next, allowedRoles);
      });
    }

    return checkRole(req, res, next, allowedRoles);
  };
}

function checkRole(req, res, next, allowedRoles) {
  if (!req.user || !allowedRoles.includes(req.user.role_id)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this resource.',
      requiredRoles: allowedRoles,
      userRole: req.user?.role_id,
    });
  }

  next();
}
