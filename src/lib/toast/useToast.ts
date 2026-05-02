export type ToastMessage = {
  message: string;
  variant?: 'info' | 'success' | 'error';
};

export function useToast() {
  return {
    showToast: (toast: ToastMessage) => {
      console.log('[toast]', toast.variant ?? 'info', toast.message);
    },
  };
}
