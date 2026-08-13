import { useCallback, useEffect, useRef } from 'react';
import { track } from '../lib/track/track';

type ShareMenuProps = {
  isOpen: boolean;
  title: string;
  text: string;
  onClose: () => void;
};

type ShareOption = {
  id: string;
  label: string;
  icon: string;
  getUrl: (p: { title: string; text: string }) => string;
};

const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    getUrl: ({ text }) =>
      `https://wa.me/?text=${encodeURIComponent(text)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: '📘',
    getUrl: ({ text }) =>
      `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: '🔗',
    getUrl: ({ text }) =>
      `https://www.linkedin.com/sharing/share-offsite/?summary=${encodeURIComponent(text)}`,
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    icon: '🐦',
    getUrl: ({ text }) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
];

export function ShareMenu({ isOpen, title, text, onClose }: ShareMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text });
        track('story_shared', { channel: 'native' });
        onClose();
        return;
      } catch {
        // ignorar
      }
    }
    // fallback: copiar para área de transferência
    try {
      await navigator.clipboard.writeText(text);
      track('story_shared', { channel: 'native' });
      onClose();
    } catch {
      // ignorar
    }
  }, [title, text, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="share-menu" role="dialog" aria-label="Compartilhar história">
        <div className="share-menu__header">
          <h3 className="share-menu__title">Compartilhar história</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="share-menu__body">
          <p className="share-menu__subtitle">Escolha uma plataforma:</p>
          <div className="share-menu__options">
            {SHARE_OPTIONS.map((option) => (
              <a
                key={option.id}
                href={option.getUrl({ title, text })}
                target="_blank"
                rel="noopener noreferrer"
                className="share-menu__option"
                onClick={() => {
                  track('story_shared', { channel: option.id });
                  onClose();
                }}
              >
                <span className="share-menu__option-icon">{option.icon}</span>
                <span className="share-menu__option-label">{option.label}</span>
              </a>
            ))}
          </div>
          <button
            type="button"
            className="share-menu__native"
            onClick={handleNativeShare}
          >
            Mais aplicativos... {typeof navigator.share === 'function' ? '📲' : '📋'}
          </button>
        </div>
      </div>
    </div>
  );
}
