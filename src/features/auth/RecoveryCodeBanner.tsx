import { useState } from 'react';

type RecoveryCodeBannerProps = {
  recoveryCode: string;
  onDismiss: () => void;
};

export function RecoveryCodeBanner({ recoveryCode, onDismiss }: RecoveryCodeBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="recovery-banner">
      <div className="recovery-banner__content">
        <span className="recovery-banner__icon">🔑</span>
        <div className="recovery-banner__text">
          <strong>Seu código de recuperação:</strong>
          <code className="recovery-banner__code">{recoveryCode}</code>
          <span className="recovery-banner__hint">
            Anote este código. Ele permite acessar suas memórias em outro dispositivo.
          </span>
        </div>
      </div>
      <div className="recovery-banner__actions">
        <button
          type="button"
          className="btn btn--primary btn--small"
          onClick={handleCopy}
        >
          {copied ? 'Copiado!' : 'Copiar código'}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={onDismiss}
        >
          Dispensar
        </button>
      </div>
    </div>
  );
}
