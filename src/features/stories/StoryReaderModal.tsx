import { useCallback, useEffect } from 'react';
import { Button } from '../../components/Button';

type StoryReaderModalProps = {
  isOpen: boolean;
  title: string | undefined;
  storyUpdatedAt: string | undefined;
  storyContent: string | undefined;
  storyMemoryCount: number | undefined;
  onCopy: () => void;
  onShare: () => void;
  onClose: () => void;
};

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'agora mesmo';
  if (diffMinutes < 60) return `há ${diffMinutes} minuto${diffMinutes === 1 ? '' : 's'}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
  if (diffDays < 30) return `há ${diffDays} dia${diffDays === 1 ? '' : 's'}`;
  return date ? new Date(isoDate).toLocaleDateString('pt-BR') : '';
}

export function StoryReaderModal({
  isOpen,
  title,
  storyUpdatedAt,
  storyContent,
  storyMemoryCount,
  onCopy,
  onShare,
  onClose,
}: StoryReaderModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay story-reader-overlay" onClick={onClose}>
      <div
        className="story-reader"
        role="dialog"
        aria-modal="true"
        aria-label="Ler história completa"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="story-reader__header">
          <div className="story-reader__header-text">
            <h2 className="story-reader__title">{title ?? 'Sua história'}</h2>
            {storyUpdatedAt ? (
              <span className="story-reader__meta">
                Atualizada {formatRelativeTime(storyUpdatedAt)}
                {typeof storyMemoryCount === 'number'
                  ? ` · ${storyMemoryCount} memória${storyMemoryCount === 1 ? '' : 's'}`
                  : ''}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="story-reader__body">
          {storyContent?.split(/\n\n+/).filter(Boolean).map((paragraph, idx) => (
            <p key={idx}>{paragraph.trim()}</p>
          ))}
        </div>
        <div className="story-reader__footer">
          <Button type="button" variant="secondary" onClick={onCopy}>
            Copiar História
          </Button>
          <Button type="button" variant="secondary" onClick={onShare}>
            Compartilhar
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
