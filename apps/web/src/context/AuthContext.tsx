import React, { createContext, useContext, useState, useEffect } from 'react';

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
  signInWithOAuth: (provider: 'google' | 'apple' | 'github') => Promise<void>;
  signInWithEmail: (email: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, name: string, password?: string) => Promise<void>;
  signOut: () => void;
  updatePlan: (plan: 'basic' | 'plus' | 'pro' | 'ultra') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('hedger-user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

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

  const signInWithOAuth = async (provider: 'google' | 'apple' | 'github') => {
    // Instant seamless institutional mock authentication
    const mockUsers: Record<string, UserProfile> = {
      google: {
        id: 'usr_g_98214',
        name: 'Alex Morgan',
        email: 'alex.morgan@hedger.capital',
        provider: 'google',
        avatar: '/user-avatar.png',
        plan: 'pro',
        savedModelsCount: 4
      },
      apple: {
        id: 'usr_a_74120',
        name: 'Morgan Vance',
        email: 'm.vance@privaterelay.appleid.com',
        provider: 'apple',
        avatar: '/user-avatar.png',
        plan: 'plus',
        savedModelsCount: 2
      },
      github: {
        id: 'usr_gh_33109',
        name: 'Devin Hedger',
        email: 'devin@github.users.noreply',
        provider: 'github',
        avatar: '/user-avatar.png',
        plan: 'ultra',
        savedModelsCount: 8
      }
    };

    setUser(mockUsers[provider] || mockUsers.google);
  };

  const signInWithEmail = async (email: string) => {
    const username = email.split('@')[0] || 'Investor';
    const capitalized = username.charAt(0).toUpperCase() + username.slice(1);
    setUser({
      id: `usr_em_${Date.now().toString(36)}`,
      name: capitalized,
      email,
      provider: 'email',
      plan: 'basic',
      savedModelsCount: 1
    });
  };

  const signUpWithEmail = async (email: string, name: string) => {
    setUser({
      id: `usr_em_${Date.now().toString(36)}`,
      name: name.trim() || 'Institutional Allocator',
      email,
      provider: 'email',
      plan: 'pro', // Free trial on Pro for new signups
      savedModelsCount: 0
    });
  };

  const signOut = () => {
    setUser(null);
  };

  const updatePlan = (plan: 'basic' | 'plus' | 'pro' | 'ultra') => {
    if (user) {
      setUser({ ...user, plan });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signInWithOAuth,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updatePlan
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
