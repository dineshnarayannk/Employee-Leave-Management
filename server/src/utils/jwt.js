import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Generate a signed JWT
 * @param {object} payload - Safe user claims (id, email, role_id)
 * @returns {string} Signed JWT token
 */
export function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Verify and decode a JWT
 * @param {string} token - JWT token string
 * @returns {object} Decoded token payload
 */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

/**
 * Attach HTTP-only authentication cookie to response
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setAuthCookie(res, token) {
  const isProd = config.nodeEnv === 'production';
  
  res.cookie(config.jwt.cookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  });
}

/**
 * Clear authentication cookie from response
 * @param {import('express').Response} res
 */
export function clearAuthCookie(res) {
  const isProd = config.nodeEnv === 'production';

  res.clearCookie(config.jwt.cookieName, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
}
