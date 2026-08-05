import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE === 'auto_demo') ? 'auto_demo' : 'required';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isInitializing: boolean;
  isAutoAuthenticating: boolean;
  isAuthenticated: boolean;
  authMode: 'auto_demo' | 'required';
  error: Error | null;
  retry: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAutoAuthenticating, setIsAutoAuthenticating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const autoAuthLock = useRef(false);

  const initialize = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        setIsInitializing(false);
        return;
      }

      if (AUTH_MODE === 'auto_demo') {
        if (autoAuthLock.current) return;
        autoAuthLock.current = true;
        setIsAutoAuthenticating(true);
        setIsInitializing(false);
        
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;

        // Provision demo workspace
        const { error: rpcError } = await supabase.rpc('ensure_demo_workspace');
        if (rpcError) {
          console.error('Failed to provision demo workspace', rpcError);
          throw rpcError;
        }

        autoAuthLock.current = false;
        setIsAutoAuthenticating(false);
      } else {
        setIsInitializing(false);
      }
    } catch (err: any) {
      console.error('Auth initialization error:', err);
      setError(err);
      setIsInitializing(false);
      setIsAutoAuthenticating(false);
      autoAuthLock.current = false;
    }
  };

  useEffect(() => {
    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    isInitializing,
    isAutoAuthenticating,
    isAuthenticated: !!session,
    authMode: AUTH_MODE,
    error,
    retry: initialize,
    signOut,
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
