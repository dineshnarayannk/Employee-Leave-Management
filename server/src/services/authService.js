import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env.js';
import { query } from '../db/index.js';
import { signToken } from '../utils/jwt.js';

let googleClientInstance = null;

function getGoogleClient() {
  if (!googleClientInstance) {
    googleClientInstance = new OAuth2Client(config.google.clientId);
  }
  return googleClientInstance;
}

/**
 * Verify Google ID Token received from frontend Google Identity Services
 * @param {string} idToken
 * @returns {Promise<{ googleId: string, email: string, name: string, picture?: string }>}
 */
export async function verifyGoogleCredential(idToken) {
  if (!config.google.clientId) {
    const error = new Error('Google OAuth is not configured on the server. Missing GOOGLE_CLIENT_ID.');
    error.statusCode = 500;
    throw error;
  }

  const client = getGoogleClient();

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      const error = new Error('Invalid Google token: email not found in token payload');
      error.statusCode = 400;
      throw error;
    }

    // Verify token issuer
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      const error = new Error('Invalid Google token: untrusted issuer');
      error.statusCode = 400;
      throw error;
    }

    // Verify Google Subject ID (sub)
    if (!payload.sub) {
      const error = new Error('Invalid Google token: missing Google subject identifier');
      error.statusCode = 400;
      throw error;
    }

    if (!payload.email_verified) {
      const error = new Error('Google email address has not been verified by Google.');
      error.statusCode = 400;
      throw error;
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || null,
    };
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error(`Google token verification failed: ${err.message}`);
    error.statusCode = 401;
    throw error;
  }
}

/**
 * Authenticates a Google user against the TiDB database and generates application JWT
 * @param {string} credential - Google ID token
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function authenticateGoogleUser(credential) {
  // 1. Verify token with Google
  const googleData = await verifyGoogleCredential(credential);

  // 2. Look up user by verified email in database
  const sql = `
    SELECT 
      u.id, 
      u.google_id, 
      u.name, 
      u.email, 
      u.role_id, 
      r.name AS role_name, 
      u.department, 
      u.manager_id, 
      u.is_active
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE LOWER(u.email) = ?
    LIMIT 1
  `;

  const users = await query(sql, [googleData.email]);

  // 3. Reject unregistered accounts
  if (!users || users.length === 0) {
    const error = new Error('Your Google account is not registered. Please contact the administrator.');
    error.statusCode = 401;
    throw error;
  }

  const user = users[0];

  // 4. Reject inactive accounts
  if (!user.is_active) {
    const error = new Error('Your account is inactive. Please contact the administrator.');
    error.statusCode = 403;
    throw error;
  }

  // 5. Update google_id if not yet linked
  if (!user.google_id || user.google_id !== googleData.googleId) {
    try {
      await query('UPDATE users SET google_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        googleData.googleId,
        user.id,
      ]);
      user.google_id = googleData.googleId;
    } catch (updateErr) {
      console.error('Warning: Failed to update user google_id:', updateErr.message);
    }
  }

  // 6. Record audit log for login
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) 
       VALUES (?, 'USER_LOGIN', 'user', ?, ?)`,
      [
        user.id,
        user.id,
        JSON.stringify({ 
          email: user.email, 
          role_id: user.role_id, 
          role_name: user.role_name,
          login_time: new Date().toISOString() 
        }),
      ]
    );
  } catch (auditErr) {
    console.error('Warning: Failed to record login audit log:', auditErr.message);
  }

  // 7. Generate application JWT
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role_id: user.role_id,
  };
  const token = signToken(tokenPayload);

  // 8. Return safe user object
  const safeUser = {
    id: user.id,
    google_id: user.google_id,
    name: user.name,
    email: user.email,
    role_id: user.role_id,
    role_name: user.role_name,
    department: user.department,
    manager_id: user.manager_id,
    is_active: Boolean(user.is_active),
    picture: googleData.picture,
  };

  return { token, user: safeUser };
}

/**
 * Retrieve user by ID directly from DB to prevent stale permissions
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
export async function getUserById(userId) {
  const sql = `
    SELECT 
      u.id, 
      u.google_id, 
      u.name, 
      u.email, 
      u.role_id, 
      r.name AS role_name, 
      u.department, 
      u.manager_id, 
      u.is_active
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
    LIMIT 1
  `;

  const rows = await query(sql, [userId]);
  if (!rows || rows.length === 0) return null;

  const user = rows[0];
  return {
    id: user.id,
    google_id: user.google_id,
    name: user.name,
    email: user.email,
    role_id: user.role_id,
    role_name: user.role_name,
    department: user.department,
    manager_id: user.manager_id,
    is_active: Boolean(user.is_active),
  };
}
