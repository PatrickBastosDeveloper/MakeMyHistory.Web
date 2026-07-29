import { useState } from 'react';
import { Button } from '../../components/Button';

type OnboardingModalProps = {
  recoveryCode: string;
  onDismiss: () => void;
};

export function OnboardingModal({ recoveryCode, onDismiss }: OnboardingModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCode).then(() => {
      setCopied(true);
    }).catch(() => {});
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) return; }}>
      <div className="modal modal--sm" role="dialog" aria-modal="true" aria-label="Código de recuperação">
        <div className="modal__header">
          <h2 className="modal__title">🔑 Sua chave de acesso</h2>
        </div>

        <div className="modal__body">
          <p className="modal__message" style={{ marginBottom: '1rem' }}>
            Guarde este código em um lugar seguro.
          </p>
          <p className="modal__message" style={{ marginBottom: '1rem' }}>
            Com ele você pode acessar suas memórias de outro dispositivo
            ou recuperar sua conta se perder os dados do navegador.
          </p>

          <div className="recovery-code-display">
            <code className="recovery-code-display__code">{recoveryCode}</code>
          </div>

          <p className="modal__message" style={{ marginTop: '0.75rem', fontSize: '0.875rem', opacity: 0.7 }}>
            {copied
              ? '✅ Código copiado'
              : 'Você poderá recuperá-lo depois em: Perfil → Código de recuperação'}
          </p>
        </div>

        <div className="modal__footer">
          <Button type="button" variant="primary" onClick={handleCopy}>
            {copied ? '✅ Código copiado' : 'Copiar Código'}
          </Button>
          <Button type="button" variant="ghost" onClick={onDismiss}>
            Entendi, vamos começar
          </Button>
        </div>
      </div>
    </div>
  );
}
