import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, setOnUnauthorized, User } from '../services';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // When the API rejects our token, drop straight back to the login screen
    setOnUnauthorized(() => setUser(null));
    return () => setOnUnauthorized(null);
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) return;

      const storedUser = await authService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }

      // Refresh from the server in the background; a 401 here triggers
      // the onUnauthorized handler and logs the user out
      try {
        const freshUser = await authService.getProfile();
        setUser(freshUser);
      } catch {
        // Offline or server unavailable: keep the stored user
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email: email.trim(), password });
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register({ name: name.trim(), email: email.trim(), password });
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
