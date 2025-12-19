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

/**
 * Custom error class for API errors with status code
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Parse error message from API response
 */
async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return data.message || data.error || `Error: ${response.status}`;
    }
    const text = await response.text();
    return text || `Error: ${response.status}`;
  } catch {
    return `Error: ${response.status}`;
  }
}

/**
 * Get user-friendly message for 403 errors
 */
function getForbiddenMessage(apiMessage: string): string {
  // If the API returns a specific message, use it
  if (apiMessage && apiMessage !== 'Forbidden' && apiMessage !== 'Error: 403') {
    // Make the message more user-friendly
    if (apiMessage.toLowerCase().includes('unauthorized access')) {
      return 'Access Denied: You do not have the required permissions to perform this action. Please contact your administrator if you believe this is an error.';
    }
    return `Access Denied: ${apiMessage}`;
  }
  return 'Access Denied: You do not have permission to access this resource. Please contact your administrator if you need access.';
}

// Global fetch wrapper to handle 401 and 403 errors
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // If unauthorized, trigger logout
  if (response.status === 401) {
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

/**
 * Enhanced fetch that throws ApiError with proper messages for error responses
 * Use this when you want automatic error throwing with meaningful messages
 */
export async function fetchWithErrorHandling<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response);
    
    // Handle 401 - Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('tokenExpiry');
      
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      throw new ApiError('Your session has expired. Please log in again.', 401);
    }
    
    // Handle 403 - Forbidden
    if (response.status === 403) {
      const friendlyMessage = getForbiddenMessage(errorMessage);
      throw new ApiError(friendlyMessage, 403);
    }
    
    // Handle other errors
    throw new ApiError(errorMessage, response.status);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  
  return response as unknown as T;
}
