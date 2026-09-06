import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import type { FeedbackType } from '../../types/feedback';

const FEEDBACK_TYPES: FeedbackType[] = ['Problema', 'Sugestão', 'Dúvida', 'Outro'];
const MAX_MESSAGE_LENGTH = 1000;

type FeedbackModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { type: FeedbackType; message: string }) => void;
};

export function FeedbackModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [typeError, setTypeError] = useState(false);
  const [messageError, setMessageError] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Reset the form whenever the modal opens.
  useEffect(() => {
    if (isOpen) {
      setType(null);
      setMessage('');
      setTypeError(false);
      setMessageError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = message.trim();
    const selectedType = type;

    if (!selectedType) {
      setTypeError(true);
      return;
    }
    if (!trimmed) {
      setMessageError(true);
      return;
    }

    onSubmit({ type: selectedType, message: trimmed });
  };

  const messageLength = message.length;

  return (
    <div className="modal-overlay feedback-modal-overlay" onClick={onClose}>
      <div
        className="feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Enviar feedback"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="feedback-modal__header">
          <h2 className="feedback-modal__title">💬 Enviar feedback</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="feedback-modal__body">
          <p className="feedback-modal__description">
            Encontrou algum problema ou tem alguma sugestão para melhorar o MakeMyHistory?
            <br />
            Seu feedback ajuda a evoluir o produto.
          </p>

          <div className="feedback-modal__field">
            <span className="feedback-modal__label">Tipo do feedback</span>
            <div className="feedback-modal__options" role="radiogroup" aria-label="Tipo do feedback">
              {FEEDBACK_TYPES.map((option) => (
                <label key={option} className="feedback-modal__option">
                  <input
                    type="radio"
                    name="feedback-type"
                    value={option}
                    checked={type === option}
                    onChange={() => {
                      setType(option);
                      setTypeError(false);
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {typeError ? (
              <span className="feedback-modal__error">Selecione um tipo de feedback.</span>
            ) : null}
          </div>

          <div className="feedback-modal__field">
            <label className="feedback-modal__label" htmlFor="feedback-message">
              Mensagem
            </label>
            <textarea
              id="feedback-message"
              className="feedback-modal__textarea"
              placeholder="Descreva seu feedback..."
              maxLength={MAX_MESSAGE_LENGTH}
              rows={5}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setMessageError(false);
              }}
            />
            <div className="feedback-modal__counter">
              {messageError ? (
                <span className="feedback-modal__error">A mensagem é obrigatória.</span>
              ) : null}
              <span className="feedback-modal__count">
                {messageLength}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>
        </div>

        <div className="feedback-modal__footer">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar feedback'}
          </Button>
        </div>
      </div>
    </div>
  );
}
