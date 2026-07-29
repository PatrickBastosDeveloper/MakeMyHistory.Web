import { useState } from 'react';

type OnboardingModalProps = {
  recoveryCode: string;
  onDismiss: () => void;
};

export function OnboardingModal({ recoveryCode, onDismiss }: OnboardingModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) return; // só fecha pelo botão
  };

  return (
    <div className="modal-overlay onboarding-overlay" onClick={handleBackdropClick}>
      <div className="modal onboarding-modal" role="dialog" aria-modal="true">
        <div className="onboarding-modal__icon">🔑</div>

        <h2 className="onboarding-modal__title">
          Sua chave de acesso
        </h2>

        <p className="onboarding-modal__desc">
          Este é seu <strong>código de recuperação</strong>.
          Guarde-o em um lugar seguro.
        </p>

        <p className="onboarding-modal__desc">
          Com ele você pode acessar suas memórias de outro dispositivo
          ou recuperar sua conta se perder os dados do navegador.
        </p>

        <div className="onboarding-modal__code-wrapper">
          <code className="onboarding-modal__code">{recoveryCode}</code>
        </div>

        <div className="onboarding-modal__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleCopy}
          >
            {copied ? 'Copiado ✓' : 'Copiar código'}
          </button>

          <button
            type="button"
            className="btn btn--secondary"
            onClick={onDismiss}
          >
            Entendi, vamos começar!
          </button>
        </div>
      </div>
    </div>
  );
}
