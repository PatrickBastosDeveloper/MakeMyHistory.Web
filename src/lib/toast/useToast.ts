import { showToast } from './toastStore';

export type ToastMessage = {
  message: string;
  variant?: 'info' | 'success' | 'error';
};

export function useToast() {
  return {
    showToast: (toast: ToastMessage) => {
      showToast(toast.message, toast.variant ?? 'info');
    },
  };
}
