import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchApi } from '../apiClient';

const AUTH_MODE: 'auto_demo' | 'required' = (process.env.AUTH_MODE === 'auto_demo') ? 'auto_demo' : 'required';

interface Session {
  access_token?: string; // Kept for interface compatibility
  user: any;
}

interface AuthContextType {
  session: Session | null;
  user: any | null;
  isInitializing: boolean;
  isAutoAuthenticating: boolean;
  isAuthenticated: boolean;
  authMode: 'auto_demo' | 'required';
  error: Error | null;
  retry: () => void;
  signOut: () => Promise<void>;
  enterDemoMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setIsInitializing(true);
    try {
      // Simulate checking session locally for the demo
      if (AUTH_MODE === 'auto_demo') {
        await enterDemoMode();
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsInitializing(false);
    }
  };

  const signOut = async () => {
    setSession(null);
    setUser(null);
  };

  const enterDemoMode = async () => {
    try {
      // Mock successful login instantly
      const mockUser = { username: 'testuser', email: 'admin@company.com' };
      setUser(mockUser);
      setSession({ user: mockUser });
    } catch (e) {
      console.error('Demo login failed', e);
    }
  };

  const value = {
    session,
    user,
    isInitializing,
    isAutoAuthenticating: false,
    isAuthenticated: !!session,
    authMode: AUTH_MODE,
    error,
    retry: checkSession,
    signOut,
    enterDemoMode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
