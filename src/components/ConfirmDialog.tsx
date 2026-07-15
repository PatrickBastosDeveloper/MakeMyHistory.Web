import { Button } from './Button';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--sm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onCancel} aria-label="Fechar">✕</button>
        </div>

        <div className="modal__body">
          <p className="modal__message">{message}</p>
        </div>

        <div className="modal__footer">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isLoading}
            onClick={onConfirm}
            className={variant === 'danger' ? 'button--danger-confirm' : undefined}
          >
            {isLoading ? 'Aguarde...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
