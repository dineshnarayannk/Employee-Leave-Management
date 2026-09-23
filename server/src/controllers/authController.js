import { googleAuthSchema } from '../validators/authValidator.js';
import { authenticateGoogleUser } from '../services/authService.js';
import { setAuthCookie, clearAuthCookie } from '../utils/jwt.js';

/**
 * Handle Google OAuth Sign-in
 * @route POST /api/auth/google
 */
export async function handleGoogleLogin(req, res) {
  try {
    // 1. Validate request payload
    const parseResult = googleAuthSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid login request',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const { credential } = parseResult.data;

    // 2. Authenticate user against Google and database
    const { token, user } = await authenticateGoogleUser(credential);

    // 3. Set secure HTTP-only cookie
    setAuthCookie(res, token);

    // 4. Return safe user details
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Authentication failed. Please try again.';

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

/**
 * Get current authenticated user profile
 * @route GET /api/auth/me
 */
export async function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

/**
 * Logout authenticated user
 * @route POST /api/auth/logout
 */
export async function handleLogout(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}
