import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { submitFeedback } from '../../services/feedbackService';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../../lib/toast/useToast';
import { FeedbackModal } from './FeedbackModal';
import type { FeedbackPayload, FeedbackType } from '../../types/feedback';

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0';

export function FeedbackButton() {
  const { userId, isReady } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ type, message }: { type: FeedbackType; message: string }) => {
      const payload: FeedbackPayload = {
        type,
        message,
        appVersion: APP_VERSION,
        userAgent: window.navigator.userAgent,
        screenWidth: window.screen?.width ?? null,
        screenHeight: window.screen?.height ?? null,
      };
      return submitFeedback(userId, payload);
    },
    onSuccess: () => {
      setIsOpen(false);
      showToast({
        message: '✅ Obrigado pelo feedback!\nSua contribuição ajuda a melhorar o MakeMyHistory.',
        variant: 'success',
      });
    },
    onError: (error) => {
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Não foi possível enviar seu feedback. Tente novamente.';
      showToast({ message: msg, variant: 'error' });
    },
  });

  // Only show the floating button on authenticated screens.
  if (!isReady) return null;

  return (
    <>
      <button
        type="button"
        className="feedback-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Enviar feedback"
        title="Feedback"
      >
        <span className="feedback-fab__icon" aria-hidden="true">💬</span>
        <span className="feedback-fab__label">Feedback</span>
      </button>

      <FeedbackModal
        isOpen={isOpen}
        isSubmitting={mutation.isPending}
        onClose={() => setIsOpen(false)}
        onSubmit={({ type, message }) => mutation.mutate({ type, message })}
      />
    </>
  );
}
