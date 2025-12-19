'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';

interface User {
  email: string;
  name: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: User, expiresIn?: string) => void;
  logout: () => void;
  checkTokenValidity: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ------------------ helpers ------------------ */

function parseExpiryToMs(expiresIn: string = '1h'): number {
  if (/^\d+$/.test(expiresIn)) return Number(expiresIn) * 1000;
  if (expiresIn.endsWith('h')) return Number(expiresIn.slice(0, -1)) * 3600 * 1000;
  if (expiresIn.endsWith('m')) return Number(expiresIn.slice(0, -1)) * 60 * 1000;
  if (expiresIn.endsWith('d')) return Number(expiresIn.slice(0, -1)) * 86400 * 1000;
  return 3600 * 1000;
}

/* ------------------ provider ------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('tokenExpiry');

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const checkTokenValidity = useCallback(async (): Promise<boolean> => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (!tokenExpiry) return false;

    const expiryTime = parseInt(tokenExpiry, 10);
    if (Date.now() >= expiryTime) {
      logout();
      return false;
    }
    return true;
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';

        if (storedUser && loggedIn) {
          const valid = await checkTokenValidity();
          if (valid) {
            setUser(JSON.parse(storedUser));
            setIsLoggedIn(true);
          } else {
            logout();
          }
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [checkTokenValidity, logout]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(checkTokenValidity, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, checkTokenValidity]);

  const login = (userData: User, expiresIn: string = '1h') => {
    setUser(userData);
    setIsLoggedIn(true);

    const expiryTime = Date.now() + parseExpiryToMs(expiresIn);

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('tokenExpiry', expiryTime.toString());
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isLoading, login, logout, checkTokenValidity }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------ hook ------------------ */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/* ------------------ authenticated fetch ------------------ */

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('tokenExpiry');

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  return response;
}