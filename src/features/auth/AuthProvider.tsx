import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { initUser, recoverUser } from '../../services/initService';

const USER_ID_STORAGE_KEY = 'userId';
const RECOVERY_CODE_STORAGE_KEY = 'recoveryCode';
const HAS_SEEN_RECOVERY_KEY = 'hasSeenRecoveryCode';

type AuthContextValue = {
  userId: string;
  isReady: boolean;
  recoveryCode: string | null;
  showRecoveryBanner: boolean;
  dismissRecoveryBanner: () => void;
  recoverAccount: (code: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUserId() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(USER_ID_STORAGE_KEY);
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [userId, setUserId] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const storedUserId = getStoredUserId();

      try {
        const response = await initUser(storedUserId ?? undefined);
        window.localStorage.setItem(USER_ID_STORAGE_KEY, response.userId);
        window.localStorage.setItem(RECOVERY_CODE_STORAGE_KEY, response.recoveryCode);

        if (!cancelled) {
          setUserId(response.userId);
          setRecoveryCode(response.recoveryCode);
          setIsReady(true);

          // Show recovery banner on first visit (no stored userId = new user)
          const hasSeen = window.localStorage.getItem(HAS_SEEN_RECOVERY_KEY);
          if (!storedUserId && !hasSeen) {
            setShowRecoveryBanner(true);
          }
        }
      } catch {
        // Fallback: se não conseguir contatar o backend, usa ID local
        const fallbackId = storedUserId ?? crypto.randomUUID();
        if (!storedUserId) {
          window.localStorage.setItem(USER_ID_STORAGE_KEY, fallbackId);
        }
        if (!cancelled) {
          setUserId(fallbackId);
          setRecoveryCode(null);
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

  const dismissRecoveryBanner = useCallback(() => {
    setShowRecoveryBanner(false);
    window.localStorage.setItem(HAS_SEEN_RECOVERY_KEY, 'true');
  }, []);

  const recoverAccount = useCallback(async (code: string) => {
    const response = await recoverUser(code);
    window.localStorage.setItem(USER_ID_STORAGE_KEY, response.userId);
    setUserId(response.userId);
  }, []);

  const value = useMemo(
    () => ({ userId, isReady, recoveryCode, showRecoveryBanner, dismissRecoveryBanner, recoverAccount }),
    [isReady, userId, recoveryCode, showRecoveryBanner, dismissRecoveryBanner, recoverAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
