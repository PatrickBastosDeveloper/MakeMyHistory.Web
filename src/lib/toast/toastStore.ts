export type ToastVariant = 'info' | 'success' | 'error';

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let listeners: Listener[] = [];
let nextId = 1;

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getToasts(): ToastItem[] {
  return toasts;
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export function showToast(
  message: string,
  variant: ToastVariant = 'info',
  duration = 3500,
): void {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emit();

  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
}

function emit(): void {
  for (const listener of listeners) {
    listener(toasts);
  }
}
