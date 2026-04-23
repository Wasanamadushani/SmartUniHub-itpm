import { createContext, useContext, useEffect, useState } from 'react';
import { readStoredUser, storeAuthenticatedUser, clearAuthenticatedUser } from '../lib/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = readStoredUser();
    setUser(storedUser);
    setLoading(false);

    // Listen for auth changes
    const handleAuthChange = () => {
      const updatedUser = readStoredUser();
      setUser(updatedUser);
    };

    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  const login = (userData) => {
    storeAuthenticatedUser(userData);
    setUser(userData);
  };

  const logout = () => {
    clearAuthenticatedUser();
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
