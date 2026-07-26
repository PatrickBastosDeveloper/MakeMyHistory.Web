import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { initUser } from '../../services/initService';

const USER_ID_STORAGE_KEY = 'userId';
const RECOVERY_CODE_STORAGE_KEY = 'recoveryCode';

type AuthContextValue = {
  userId: string;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUserId() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(USER_ID_STORAGE_KEY);
}

function getUserIdFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const userIdFromUrl = params.get('userId');
    if (!userIdFromUrl) return null;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdFromUrl)
      ? userIdFromUrl
      : null;
  } catch {
    return null;
  }
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [userId, setUserId] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const userIdFromUrl = getUserIdFromUrl();
      if (userIdFromUrl) {
        window.localStorage.setItem(USER_ID_STORAGE_KEY, userIdFromUrl);
        if (!cancelled) {
          setUserId(userIdFromUrl);
          setIsReady(true);
        }
        return;
      }

      const storedUserId = getStoredUserId();
      try {
        const response = await initUser(storedUserId ?? undefined);
        window.localStorage.setItem(USER_ID_STORAGE_KEY, response.userId);
        window.localStorage.setItem(RECOVERY_CODE_STORAGE_KEY, response.recoveryCode);
        if (!cancelled) {
          setUserId(response.userId);
          setIsReady(true);
        }
      } catch {
        // Fallback: se não conseguir contatar o backend, usa ID local
        const fallbackId = storedUserId ?? crypto.randomUUID();
        if (!storedUserId) {
          window.localStorage.setItem(USER_ID_STORAGE_KEY, fallbackId);
        }
        if (!cancelled) {
          setUserId(fallbackId);
          setIsReady(true);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== USER_ID_STORAGE_KEY) return;
      if (event.newValue) setUserId(event.newValue);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(() => ({ userId, isReady }), [isReady, userId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
