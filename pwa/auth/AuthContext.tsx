import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (navigator.onLine) {
        const response = await fetch('/api/lite/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } else {
        // Check offline auth
        const offlineUser = localStorage.getItem('pwa-user');
        if (offlineUser) {
          setUser(JSON.parse(offlineUser));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      if (navigator.onLine) {
        const response = await fetch('/api/lite/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
          localStorage.setItem('pwa-user', JSON.stringify(userData.user));
          return true;
        }
      } else {
        // Offline login with default credentials
        if (username === 'Admin' && password === 'admin123') {
          const offlineUser = {
            id: 'offline-user',
            username: 'Admin',
            email: 'admin@financeai.com'
          };
          setUser(offlineUser);
          localStorage.setItem('pwa-user', JSON.stringify(offlineUser));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pwa-user');
    if (navigator.onLine) {
      fetch('/api/lite/logout', { method: 'POST' });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}