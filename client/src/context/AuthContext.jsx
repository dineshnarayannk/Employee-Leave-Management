import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginWithGoogle, getAuthUser, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: 1,
  MANAGER: 2,
  EMPLOYEE: 3,
};

export const ROLE_NAMES = {
  1: 'Admin',
  2: 'Manager',
  3: 'Employee',
};

/**
 * Returns default portal path based on role_id
 * @param {number} roleId
 * @returns {string}
 */
export function getPortalPath(roleId) {
  switch (Number(roleId)) {
    case ROLES.ADMIN:
      return '/admin';
    case ROLES.MANAGER:
      return '/manager';
    case ROLES.EMPLOYEE:
      return '/employee';
    default:
      return '/';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Refetches authenticated user profile from backend
   */
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await getAuthUser();
      if (response && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 just means not logged in yet; no critical error
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check current session on application mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Performs login with Google ID token credential
   * @param {string} credential - Google OAuth ID Token
   */
  const login = async (credential) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await loginWithGoogle(credential);
      if (response && response.user) {
        setUser(response.user);
        return response.user;
      }
      throw new Error('Invalid user payload received from server');
    } catch (err) {
      const message = err.message || 'Google login failed. Please try again.';
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clears authentication session
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      setUser(null);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authError,
    setAuthError,
    roleId: user?.role_id || null,
    roleName: user?.role_name || (user?.role_id ? ROLE_NAMES[user.role_id] : null),
    login,
    logout,
    refreshUser,
    getPortalPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
