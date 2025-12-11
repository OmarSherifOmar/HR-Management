'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

// Parse JWT expiry string to milliseconds
function parseExpiryToMs(expiresIn: string = '1h'): number {
  if (/^\d+$/.test(expiresIn)) return Number(expiresIn) * 1000;
  if (expiresIn.endsWith('h')) return Number(expiresIn.slice(0, -1)) * 3600 * 1000;
  if (expiresIn.endsWith('m')) return Number(expiresIn.slice(0, -1)) * 60 * 1000;
  if (expiresIn.endsWith('d')) return Number(expiresIn.slice(0, -1)) * 86400 * 1000;
  return 3600 * 1000; // default 1 hour
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('tokenExpiry');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const checkTokenValidity = useCallback(async (): Promise<boolean> => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!tokenExpiry) {
      return false;
    }

    const expiryTime = parseInt(tokenExpiry, 10);
    const now = Date.now();

    // Check if token has expired
    if (now >= expiryTime) {
      console.log('Token expired, logging out...');
      logout();
      return false;
    }

    // Token still valid
    return true;
  }, [logout]);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (storedUser && loggedIn && storedUser !== 'undefined') {
          // Check if token is still valid
          const isValid = await checkTokenValidity();
          
          if (isValid) {
            setUser(JSON.parse(storedUser));
            setIsLoggedIn(true);
          } else {
            // Token expired, clear data
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('tokenExpiry');
          }
        }
      } catch (error) {
        // Clear invalid data
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('tokenExpiry');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [checkTokenValidity]);

  useEffect(() => {
    // Set up periodic token validity check (every minute)
    if (isLoggedIn) {
      const interval = setInterval(() => {
        checkTokenValidity();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [isLoggedIn, checkTokenValidity]);

  const login = (userData: User, expiresIn: string = '1h') => {
    setUser(userData);
    setIsLoggedIn(true);
    
    // Calculate token expiry time
    const expiryMs = parseExpiryToMs(expiresIn);
    const expiryTime = Date.now() + expiryMs;
    
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('tokenExpiry', expiryTime.toString());
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, logout, checkTokenValidity }}>
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

// Global fetch wrapper to handle 401 errors
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // If unauthorized, trigger logout
  if (response.status === 401) {
    console.error('Authentication failed (401) - logging out');
    
    // Clear auth data
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('tokenExpiry');
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  return response;
}
