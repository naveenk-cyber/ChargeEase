import { createContext, useContext, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LoginForm, SignupForm, User } from '../types';
import { storage } from '../utils/helpers';

/**
 * Demo authentication.
 *
 * There is no credential exchange in this build: signing in creates a local
 * session so the account areas are explorable. Nothing is sent anywhere and no
 * password is stored. The UI says so on the sign-in screen.
 */
const AUTH_TOKEN_KEY = 'chargeease_auth_token';
const USER_DATA_KEY = 'chargeease_user_data';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  signup: (userData: SignupForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function displayNameFrom(email: string): string {
  const local = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  if (!local) return 'Demo Driver';
  return local
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function createUser(overrides: Partial<User> & Pick<User, 'email' | 'name'>): User {
  return {
    id: `demo-${Date.now()}`,
    phone: '',
    avatar: undefined,
    vehicles: [],
    membershipLevel: 'Free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      units: 'imperial',
      language: 'en',
      notifications: { email: true, push: false, sms: false },
    },
    ...overrides,
  };
}

function readSession(): { user: User | null; token: string | null } {
  return {
    user: storage.get<User>(USER_DATA_KEY),
    token: storage.get<string>(AUTH_TOKEN_KEY),
  };
}

export const useAuthProvider = () => {
  // Restore the session during the first render. Reading it in an effect made
  // the protected routes render as signed-out for one frame, so a refresh on
  // /dashboard (or /wallet) could bounce the driver to /login before the
  // stored session was applied.
  const [initialSession] = useState(readSession);
  const [user, setUser] = useState<User | null>(
    initialSession.user && initialSession.token ? initialSession.user : null,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(initialSession.user && initialSession.token),
  );
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const persist = (nextUser: User) => {
    storage.set(AUTH_TOKEN_KEY, `demo-session-${Date.now()}`);
    storage.set(USER_DATA_KEY, nextUser);
    setUser(nextUser);
    setIsAuthenticated(true);
  };

  const login = async (credentials: LoginForm) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      persist(
        createUser({
          email: credentials.email,
          name: displayNameFrom(credentials.email),
          membershipLevel: 'Free',
        }),
      );
    } catch {
      throw new Error('We could not start a demo session. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupForm) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const name =
        userData.name?.trim() ||
        [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim() ||
        displayNameFrom(userData.email);

      persist(
        createUser({
          email: userData.email,
          name: name || 'Demo Driver',
          phone: userData.phone || '',
          membershipLevel: 'Free',
          preferences: {
            units: 'imperial',
            language: 'en',
            notifications: {
              email: true,
              push: Boolean(userData.newsletter),
              sms: false,
            },
          },
        }),
      );
    } catch {
      throw new Error('We could not create the demo account. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      storage.remove(AUTH_TOKEN_KEY);
      storage.remove(USER_DATA_KEY);
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!isAuthenticated) return;
    const currentUser = storage.get<User>(USER_DATA_KEY);
    if (currentUser) setUser(currentUser);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
