import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: 1,
  MANAGER: 2,
  EMPLOYEE: 3,
};

export function AuthProvider({ children }) {
  // Placeholder authentication state - will be hooked up to Google OAuth in later steps
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const value = {
    user,
    setUser,
    loading,
    setLoading,
    isAuthenticated: !!user,
    roleId: user?.role_id || null,
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
