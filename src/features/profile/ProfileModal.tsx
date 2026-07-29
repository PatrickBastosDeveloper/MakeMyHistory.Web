import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/Button';

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; birthDate: string }) => void;
  profile: { name?: string | null; birthDate?: string | null } | null | undefined;
  isSaving: boolean;
  recoveryCode: string | null;
  onRecoverAccount: () => void;
};

type ValidationErrors = {
  name?: string;
  birthDate?: string;
};

export function ProfileModal({ isOpen, onClose, onSave, profile, isSaving, recoveryCode, onRecoverAccount }: ProfileModalProps) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(profile?.name ?? '');
      setBirthDate(profile?.birthDate ?? '');
      setErrors({});
      setShowCode(false);
      setCopied(false);
    }
  }, [isOpen, profile]);

  const validate = useCallback((): ValidationErrors => {
    const errs: ValidationErrors = {};
    if (!name.trim()) errs.name = 'Nome é obrigatório.';
    if (!birthDate) errs.birthDate = 'Data de nascimento é obrigatória.';
    else {
      const d = new Date(birthDate + 'T00:00:00');
      if (isNaN(d.getTime())) errs.birthDate = 'Data inválida.';
      else {
        const min = new Date('1900-01-01T00:00:00');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (d < min) errs.birthDate = 'Data deve ser a partir de 01/01/1900.';
        else if (d > today) errs.birthDate = 'Data não pode ser futura.';
      }
    }
    return errs;
  }, [name, birthDate]);

  const handleSave = useCallback(() => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const apiDate = birthDate ? new Date(birthDate + 'T00:00:00').toISOString().split('T')[0] : '';
    if (!apiDate) return;
    onSave({ name: name.trim(), birthDate: apiDate });
  }, [name, birthDate, validate, onSave]);

  const handleCopyCode = () => {
    if (!recoveryCode) return;
    navigator.clipboard.writeText(recoveryCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  if (!isOpen) return null;

  const canSave = name.trim().length > 0 && birthDate.length > 0 && !isSaving;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Seu Perfil">
        <div className="modal__header">
          <h2 className="modal__title">Seu Perfil</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="modal__body">
          {/* ── Perfil ── */}
          <div className="input-field">
            <label className="input-field__label" htmlFor="profile-name">Nome</label>
            <input
              id="profile-name"
              className={`input${errors.name ? ' input--invalid' : ''}`}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
              placeholder="Seu nome"
              maxLength={120}
            />
            {errors.name ? <span className="date-value-error">{errors.name}</span> : null}
          </div>
          <div className="input-field">
            <label className="input-field__label" htmlFor="profile-birth">Data de nascimento</label>
            <input
              id="profile-birth"
              className={`input${errors.birthDate ? ' input--invalid' : ''}`}
              type="date"
              value={birthDate}
              onChange={(e) => { setBirthDate(e.target.value); setErrors((prev) => ({ ...prev, birthDate: undefined })); }}
              min="1900-01-01"
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.birthDate ? <span className="date-value-error">{errors.birthDate}</span> : null}
          </div>

          <hr className="profile-divider" />

          {/* ── Segurança ── */}
          <div className="security-section">
            <h3 className="security-section__title">🔑 Código de recuperação</h3>

            {recoveryCode ? (
              <>
                {showCode ? (
                  <div className="recovery-code-display" style={{ marginBottom: '0.75rem' }}>
                    <code className="recovery-code-display__code">{recoveryCode}</code>
                  </div>
                ) : null}

                <div className="security-section__actions">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCode((prev) => !prev)}
                  >
                    {showCode ? 'Ocultar código' : 'Mostrar código'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCopyCode}
                    disabled={!showCode}
                  >
                    {copied ? 'Copiado ✓' : 'Copiar código'}
                  </Button>
                </div>
              </>
            ) : (
              <p className="security-section__no-code">
                Código indisponível no momento.
              </p>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={onRecoverAccount}
            >
              ↺ Recuperar conta
            </Button>
          </div>
        </div>
        <div className="modal__footer">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="button" disabled={!canSave} onClick={handleSave}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </div>
    </div>
  );
}
