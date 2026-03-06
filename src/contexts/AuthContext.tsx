import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface AuthUser {
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'admin_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const sessionData = useQuery(api.auth.validateSession, { token: token ?? undefined });
  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);

  const loading = sessionData === undefined && token !== null;
  const user = sessionData ?? null;

  useEffect(() => {
    if (sessionData === null && token) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [sessionData, token]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await loginMutation({ email, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  }, [loginMutation]);

  const signOut = useCallback(async () => {
    if (token) {
      await logoutMutation({ token });
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, [token, logoutMutation]);

  return (
    <AuthContext.Provider value={{ user, loading, token, signIn, signOut }}>
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
