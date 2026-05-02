import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const USER_ID_STORAGE_KEY = 'userId';

type AuthContextValue = {
  userId: string;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUserId() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(USER_ID_STORAGE_KEY);
}

function createUserId() {
  return crypto.randomUUID();
}

function getInitialUserId() {
  const storedUserId = getStoredUserId();

  if (storedUserId) {
    return storedUserId;
  }

  const newUserId = createUserId();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, newUserId);

  return newUserId;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [userId, setUserId] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return getInitialUserId();
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const currentUserId = getStoredUserId();

    if (currentUserId) {
      setUserId(currentUserId);
    } else {
      const newUserId = createUserId();
      window.localStorage.setItem(USER_ID_STORAGE_KEY, newUserId);
      setUserId(newUserId);
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== USER_ID_STORAGE_KEY) {
        return;
      }

      setUserId(event.newValue ?? createUserId());
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const value = useMemo(
    () => ({
      userId,
      isReady,
    }),
    [isReady, userId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
