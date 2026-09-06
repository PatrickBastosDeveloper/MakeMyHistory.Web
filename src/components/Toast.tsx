import { useEffect, useState } from 'react';
import {
  getToasts,
  subscribe,
  dismissToast,
  type ToastItem,
} from '../lib/toast/toastStore';

const variantClassNames: Record<ToastItem['variant'], string> = {
  info: 'toast toast--info',
  success: 'toast toast--success',
  error: 'toast toast--error',
};

export function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>(getToasts());

  useEffect(() => {
    return subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={variantClassNames[toast.variant]}
          onClick={() => dismissToast(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
