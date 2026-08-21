import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { LoadingState } from '../../components/LoadingState';
import type { MemoryUI } from '../../types/memory';

const MIN_MEMORIES_FOR_STORY = 3;

type StorySectionProps = {
  successMemories: MemoryUI[];
  hasStory: boolean;
  storyTitle: string | undefined;
  storyContent: string | undefined;
  storyMemoryCount: number | undefined;
  storyUpdatedAt: string | undefined;
  isOutOfSync: boolean;
  isGenerating: boolean;
  isInsufficient: boolean;
  firstStorySeen: boolean;
  onCopy: () => void;
  onShare: () => void;
  onGenerate: () => void;
  onReadFullStory: () => void;
};

const PREVIEW_CHAR_LIMIT = 320;

function isStoryLong(content: string | undefined): boolean {
  return Boolean(content && content.trim().length > PREVIEW_CHAR_LIMIT);
}

function getStoryPreview(content: string | undefined): string {
  if (!content) return '';

  const paragraphs = content.split(/\n\n+/).filter(Boolean).map((paragraph) => paragraph.trim());
  if (paragraphs.length === 0) return '';

  const firstParagraph = paragraphs[0];
  if (firstParagraph.length <= PREVIEW_CHAR_LIMIT) return firstParagraph;

  return `${firstParagraph.slice(0, PREVIEW_CHAR_LIMIT).trimEnd()}…`;
}

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

export function StorySection({
  successMemories,
  hasStory,
  storyTitle,
  storyContent,
  storyMemoryCount,
  storyUpdatedAt,
  isOutOfSync,
  isGenerating,
  isInsufficient,
  firstStorySeen,
  onCopy,
  onShare,
  onGenerate,
  onReadFullStory,
}: StorySectionProps) {
  const hasLongStory = isStoryLong(storyContent);
  const storyPreview = getStoryPreview(storyContent);
  const fullStoryVisible = storyContent !== undefined && !hasLongStory;
  const previewVisible = hasLongStory;
  const showPlaceholder = !hasStory && successMemories.length < MIN_MEMORIES_FOR_STORY;

  return (
    <section className="panel-card">
      <Header title="Sua História" subtitle="" />
      <div className="story-two-cards">
        {/* Status card */}
        {isGenerating ? (
          <div className="story-status-card">
            <div className="story-status-card__title">Sua primeira história está sendo gerada...</div>
            <p className="story-status-card__counter">Baseada em {successMemories.length} memórias</p>
          </div>
        ) : !hasStory && !showPlaceholder ? (
          <div className="story-status-card">
            <div className="story-status-card__title">Sua primeira história está sendo gerada...</div>
            <p className="story-status-card__counter">Baseada em {successMemories.length} memórias</p>
          </div>
        ) : !hasStory && showPlaceholder ? (
          <div className="story-status-card">
            <div className="story-status-card__title">Sua história está começando.</div>
            <p className="story-status-card__desc">
              {successMemories.length === 0
                ? 'Registre memórias para criarmos sua primeira história.'
                : successMemories.length === 1
                  ? 'Registre mais memórias para criarmos sua primeira história.'
                  : 'Falta apenas mais uma memória para gerar sua primeira história.'}
            </p>
            <p className="story-status-card__counter">
              <strong>{successMemories.length}</strong> de <strong>{MIN_MEMORIES_FOR_STORY}</strong> memórias para gerar sua primeira história
            </p>
          </div>
        ) : hasStory && isInsufficient ? null : hasStory && successMemories.length < MIN_MEMORIES_FOR_STORY ? (
          <div className="story-status-card story-status-card--done">
            <div className="story-status-card__title">Sua história foi gerada anteriormente</div>
            <p className="story-status-card__counter">
              Atualmente você possui <strong>{successMemories.length}</strong> de <strong>{MIN_MEMORIES_FOR_STORY}</strong> memórias necessárias para gerar uma nova versão.
            </p>
            <p className="story-status-card__desc">Adicione mais memórias para atualizar sua história.</p>
          </div>
        ) : hasStory && !isInsufficient ? (
          <div className="story-status-card story-status-card--done">
            {!firstStorySeen ? (
              <div className="story-status-card__title">Sua primeira história está pronta!</div>
            ) : null}
            <div className="story-meta" style={{
              marginTop: !firstStorySeen ? undefined : 0,
              paddingTop: !firstStorySeen ? undefined : 0,
              borderTop: !firstStorySeen ? undefined : 'none',
            }}>
              <span className="story-meta__item">Baseada em {storyMemoryCount ?? successMemories.length} memórias</span>
              {storyUpdatedAt ? (
                <span className="story-meta__item">Atualizada {formatRelativeTime(storyUpdatedAt)}</span>
              ) : null}
            </div>
            {isOutOfSync ? (
              <p className="story-out-of-sync-message">Sua história não inclui as alterações mais recentes.</p>
            ) : null}
          </div>
        ) : null}

        {/* Content card */}
        {isGenerating ? (
          <div className="story-placeholder-card">
            <LoadingState label="Estamos escrevendo sua história..." />
          </div>
        ) : isInsufficient ? (
          <div className="story-placeholder-card">
            <div className="story-placeholder-card__icon">📝</div>
            <div className="story-placeholder-card__title">Ainda não há informações suficientes</div>
            <p className="story-placeholder-card__desc">
              Adicione mais detalhes às suas memórias para gerar uma história significativa.
            </p>
          </div>
        ) : hasStory && !isInsufficient ? (
          <article className="story-card story-card--compact">
            {storyTitle ? (
              <h2 className="story-card__title">{storyTitle}</h2>
            ) : null}
            <div className="story-card__content">
              {previewVisible ? (
                <p>{storyPreview}</p>
              ) : fullStoryVisible ? (
                storyContent?.split(/\n\n+/).filter(Boolean).map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph.trim()}</p>
                ))
              ) : null}
            </div>
            {previewVisible ? (
              <button type="button" className="story-read-link" onClick={onReadFullStory}>
                Ler história completa →
              </button>
            ) : null}
            <hr className="story-card__divider" />
            <div className="story-actions">
              {previewVisible ? (
                <Button type="button" variant="secondary" onClick={onCopy}>
                  Copiar História
                </Button>
              ) : (
                <>
                  <Button type="button" variant="secondary" onClick={onCopy}>
                    Copiar História
                  </Button>
                  <Button type="button" variant="secondary" onClick={onShare}>
                    Compartilhar
                  </Button>
                </>
              )}
              {isOutOfSync && successMemories.length >= MIN_MEMORIES_FOR_STORY ? (
                <Button
                  type="button"
                  disabled={isGenerating}
                  onClick={onGenerate}
                >
                  {isGenerating ? 'Escrevendo sua história...' : 'Atualizar história'}
                </Button>
              ) : null}
            </div>
          </article>
        ) : (
          <div className="story-placeholder-card">
            <div className="story-placeholder-card__icon">✨</div>
            <div className="story-placeholder-card__title">Sua história aparecerá aqui</div>
            {successMemories.length >= MIN_MEMORIES_FOR_STORY ? null : successMemories.length === 2 ? (
              <p className="story-placeholder-card__desc">Falta apenas 1 memória para gerar sua primeira história.</p>
            ) : successMemories.length === 1 ? (
              <p className="story-placeholder-card__desc">
                Continue registrando momentos importantes.<br />Faltam 2 memórias para gerar sua primeira história.
              </p>
            ) : (
              <p className="story-placeholder-card__desc">
                Quando você registrar pelo menos 3 memórias,<br />geraremos automaticamente sua primeira história.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
