import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'apple' | 'github' | 'email';
  avatar?: string;
  plan: 'basic' | 'plus' | 'pro' | 'ultra';
  savedModelsCount: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  signInWithOAuth: (provider: 'google' | 'apple' | 'github', customPayload?: { email?: string; name?: string }) => Promise<void>;
  signInWithEmail: (email: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, name: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePlan: (plan: 'basic' | 'plus' | 'pro' | 'ultra') => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('hedger-token');
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('hedger-user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean out any legacy mock user data
        if (parsed.name === 'Alex Morgan' || parsed.email === 'alex.morgan@hedger.capital') {
          localStorage.removeItem('hedger-user');
          localStorage.removeItem('hedger-token');
          return null;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Verify and refresh session against backend /api/auth/me
  const refreshSession = useCallback(async () => {
    try {
      const currentToken = token || localStorage.getItem('hedger-token');
      const headers: Record<string, string> = {};
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem('hedger-user', JSON.stringify(data.user));
          return;
        }
      }
      // If not authenticated on server and no active token, ensure unauthenticated state
      if (!currentToken) {
        setUser(null);
        localStorage.removeItem('hedger-user');
      }
    } catch {
      // Server unreachable
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Handle URL callback token if redirected from OAuth gateway
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const authSuccess = params.get('auth_success');

      if (urlToken && authSuccess) {
        setToken(urlToken);
        localStorage.setItem('hedger-token', urlToken);
        // Clean URL parameters without reloading
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        refreshSession();
      } else {
        refreshSession();
      }
    } catch {
      setLoading(false);
    }
  }, [refreshSession]);

  // Sync user state with localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('hedger-user', JSON.stringify(user));
      } else {
        localStorage.removeItem('hedger-user');
      }
    } catch {
      // ignore
    }
  }, [user]);

  // Sync token with localStorage
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('hedger-token', token);
      } else {
        localStorage.removeItem('hedger-token');
      }
    } catch {
      // ignore
    }
  }, [token]);

  /**
   * Institutional OAuth Gateway Exchange (Google, GitHub, Apple)
   */
  const signInWithOAuth = async (
    provider: 'google' | 'apple' | 'github',
    customPayload?: { email?: string; name?: string }
  ) => {
    setLoading(true);
    try {
      const bodyPayload = {
        provider,
        ...(customPayload?.email ? { email: customPayload.email } : {}),
        ...(customPayload?.name ? { name: customPayload.name } : {})
      };

      const res = await fetch('/api/auth/oauth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Authentication failed with ${provider}`);
      }

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('hedger-token', data.token);
        }
      } else {
        throw new Error('Invalid authentication response from server');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Institutional Email Sign In
   */
  const signInWithEmail = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password: password || '' })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      if (data.success && data.user) {
        setUser(data.user);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('hedger-token', data.token);
        }
      } else {
        throw new Error('Sign in failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Institutional Email Sign Up
   */
  const signUpWithEmail = async (email: string, name: string, password?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || email.split('@')[0],
          password: password || ''
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account. Please try again.');
      }

      if (data.success && data.user) {
        setUser(data.user);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('hedger-token', data.token);
        }
      } else {
        throw new Error('Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign Out
   */
  const signOut = async () => {
    setLoading(true);
    try {
      const currentToken = token || localStorage.getItem('hedger-token');
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        },
        credentials: 'include'
      });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('hedger-user');
      localStorage.removeItem('hedger-token');
      setLoading(false);
    }
  };

  /**
   * Upgrade / Change Subscription Plan
   */
  const updatePlan = async (plan: 'basic' | 'plus' | 'pro' | 'ultra') => {
    if (user) {
      setUser({ ...user, plan });
      try {
        const currentToken = token || localStorage.getItem('hedger-token');
        await fetch('/api/auth/plan', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({ plan })
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        token,
        loading,
        signInWithOAuth,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updatePlan,
        refreshSession
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
