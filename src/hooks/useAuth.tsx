import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE === 'auto_demo') ? 'auto_demo' : 'required';

interface Session {
  access_token: string;
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

  useEffect(() => {
    // Stubbed Azure AD authentication initialization
    setIsInitializing(false);
    
    if (AUTH_MODE === 'auto_demo') {
      enterDemoMode();
    }
  }, []);

  const signOut = async () => {
    setSession(null);
    setUser(null);
  };

  const enterDemoMode = async () => {
    const mockUser: any = {
      id: 'usr_tw',
      email: 'tanya.wahl@forrestlogistics.com',
      user_metadata: { full_name: 'Tanya Wahl' }
    };
    setUser(mockUser);
    setSession({
      access_token: 'azure_demo_token',
      user: mockUser
    });
  };

  const value = {
    session,
    user,
    isInitializing,
    isAutoAuthenticating: false,
    isAuthenticated: !!session,
    authMode: AUTH_MODE,
    error: null,
    retry: () => {},
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
