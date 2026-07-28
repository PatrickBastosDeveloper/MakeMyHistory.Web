import { useState } from 'react';
import { recoverUser } from '../../services/initService';

type RecoverModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRecovered: (userId: string) => void;
};

export function RecoverModal({ isOpen, onClose, onRecovered }: RecoverModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Digite seu código de recuperação.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await recoverUser(trimmed);
      onRecovered(response.userId);
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Código inválido. Verifique e tente novamente.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal modal--small" role="dialog" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__title">Recuperar conta</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="modal__body">
          <p className="modal__description">
            Digite o código de recuperação que apareceu quando você criou sua conta.
          </p>

          <label className="input-field">
            <span className="input-field__label">Código de recuperação</span>
            <input
              className="input"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Ex: MH-2BTUB"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              autoFocus
            />
          </label>

          {error ? <p className="input-error">{error}</p> : null}
        </div>

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={isLoading || !code.trim()}
          >
            {isLoading ? 'Recuperando...' : 'Recuperar'}
          </button>
        </div>
      </div>
    </div>
  );
}
