import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useRouter } from 'next/router';
import apiService from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setUser(null);
        return;
      }

      // TODO: Implement real token validation with backend
      // For now, we'll just check if token exists
      if (token === 'admin-token') {
        setUser({
          id: '1',
          username: 'admin',
          email: 'admin@lahamburguezona.com',
          role: 'admin'
        });
      } else {
        setUser(null);
        localStorage.removeItem('adminToken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem('adminToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with real API call
      // const response = await apiService.login(username, password);
      
      // For now, use hardcoded credentials
      if (username === 'admin' && password === 'admin123') {
        const token = 'admin-token';
        localStorage.setItem('adminToken', token);
        
        setUser({
          id: '1',
          username: 'admin',
          email: 'admin@lahamburguezona.com',
          role: 'admin'
        });
        
        router.push('/admin');
      } else {
        throw new Error('Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
    router.push('/admin/login');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
