import { useMemo, useState } from 'react';
import { formatMemoryDate } from '../../lib/date/formatMemoryDate';
import { sortMemories } from '../../lib/date/sortMemories';
import { track } from '../../lib/track/track';
import { useToast } from '../../lib/toast/useToast';
import { useCreateMemory } from '../../hooks/useCreateMemory';
import { useMemoriesTimeline } from '../../hooks/useMemoriesTimeline';
import { useMyStory } from '../../hooks/useMyStory';

const DEMO_USER_ID = 'demo-user-id';
const MAX_MEMORIES_VISIBLE = 50;

export function HomePage() {
  const { showToast } = useToast();
  const createMemoryMutation = useCreateMemory();
  const memoriesQuery = useMemoriesTimeline(DEMO_USER_ID);
  const storyQuery = useMyStory(DEMO_USER_ID);
  const [content, setContent] = useState('');

  const memories = useMemo(() => {
    return sortMemories(memoriesQuery.data?.memories ?? []).slice(0, MAX_MEMORIES_VISIBLE);
  }, [memoriesQuery.data?.memories]);

  const handleRefresh = () => {
    track('story_generate_clicked');
    showToast({
      message: 'Atualizando timeline e história...',
      variant: 'info',
    });
    void Promise.all([memoriesQuery.refetch(), storyQuery.refetch()]);
  };

  const isRefreshing = memoriesQuery.isFetching || storyQuery.isFetching;
  const canSubmit = Boolean(content.trim()) && !createMemoryMutation.isPending;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Home</p>
          <h1>Bem-vindo ao MakeMyHistory</h1>
          <p className="lead">
            Sua base para registrar memórias, ver a timeline e construir sua história pessoal.
          </p>
        </div>

        <div className="content-grid">
          <section className="panel-card">
            <div className="section-header">
              <p className="memory-label">Nova memória</p>
              <span className="timeline-count">Fluxo principal</span>
            </div>

            <div className="memory-form">
              <textarea
                id="memory-content"
                className="memory-input"
                placeholder="Escreva um momento importante..."
                value={content}
                autoFocus
                onChange={(event) => setContent(event.target.value)}
                rows={4}
                maxLength={500}
              />

              <div className="input-footer">
                <span className="timeline-count">{content.length} / 500</span>
              </div>

              <div className="hero-actions">
                <button
                  className="pill"
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => {
                    if (!canSubmit) {
                      return;
                    }

                    createMemoryMutation.mutate(
                      {
                        userId: DEMO_USER_ID,
                        content: content.trim(),
                        clientRequestId: crypto.randomUUID(),
                      },
                      {
                        onSuccess: () => {
                          track('memory_created');
                          showToast({
                            message: `Memória guardada em ${formatMemoryDate(new Date())}.`,
                            variant: 'success',
                          });
                          setContent('');
                        },
                        onError: () => {
                          showToast({
                            message: 'Não foi possível guardar a memória.',
                            variant: 'error',
                          });
                        },
                      },
                    );
                  }}
                >
                  {createMemoryMutation.isPending ? 'Guardando...' : 'Salvar memória'}
                </button>
              </div>
            </div>
          </section>

          <section className="panel-card">
            <div className="section-header">
              <p className="memory-label">Timeline</p>
              <div className="section-actions">
                <span className="timeline-count">
                  {memoriesQuery.isFetching
                    ? 'Atualizando...'
                    : memoriesQuery.isLoading
                      ? 'Carregando...'
                      : `${memories.length} memórias`}
                </span>
                <button
                  className="text-button"
                  type="button"
                  disabled={isRefreshing}
                  onClick={() => void memoriesQuery.refetch()}
                >
                  Recarregar
                </button>
              </div>
            </div>

            {memoriesQuery.isLoading ? (
              <p className="timeline-state">Carregando memórias...</p>
            ) : memoriesQuery.isError ? (
              <p className="timeline-state">Não foi possível carregar a timeline.</p>
            ) : memories.length === 0 ? (
              <div className="story-empty">
                <p className="timeline-state">Sua timeline está vazia. Escreva a primeira memória.</p>
                <p className="timeline-hint">Use o card à esquerda para começar a preencher sua história.</p>
                <div className="hero-actions">
                  <button
                    className="pill"
                    type="button"
                    disabled={isRefreshing}
                    onClick={() => void memoriesQuery.refetch()}
                  >
                    Recarregar timeline
                  </button>
                </div>
              </div>
            ) : (
              <ul className="timeline-list">
                {memories.map((memory) => (
                  <li key={memory.id} className="timeline-item">
                    <div className="timeline-item-header">
                      <strong>{memory.title ?? 'Memória sem título'}</strong>
                      <span>{formatMemoryDate(memory.createdAt)}</span>
                    </div>
                    <p>{memory.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel-card panel-card-span">
            <div className="section-header">
              <p className="memory-label">Sua história</p>
              <div className="section-actions">
                <span className="timeline-count">
                  {storyQuery.isFetching ? 'Atualizando...' : 'Leitura pessoal'}
                </span>
                <button
                  className="text-button"
                  type="button"
                  disabled={isRefreshing}
                  onClick={handleRefresh}
                >
                  Atualizar
                </button>
              </div>
            </div>

            {storyQuery.isLoading ? (
              <p className="timeline-state">Estamos escrevendo sua história...</p>
            ) : storyQuery.isError ? (
              <p className="timeline-state">Não foi possível carregar sua história.</p>
            ) : storyQuery.data?.story ? (
              <article className="story-card">
                <p>{storyQuery.data.story.content}</p>
                <div className="hero-actions">
                  <button
                    className="pill"
                    type="button"
                    disabled={storyQuery.isFetching}
                    onClick={() => {
                      track('story_generate_clicked');
                      void storyQuery.refetch();
                    }}
                  >
                    Atualizar história
                  </button>
                </div>
              </article>
            ) : (
              <div className="story-empty">
                <p className="timeline-state">Ainda não existe história gerada para você.</p>
                <p className="timeline-hint">
                  Registre algumas memórias para começar a construir a narrativa pessoal.
                </p>
                <div className="hero-actions">
                  <button
                    className="pill"
                    type="button"
                    disabled={storyQuery.isFetching}
                    onClick={() => {
                      track('story_generate_clicked');
                      void storyQuery.refetch();
                    }}
                  >
                    Gerar minha história
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="hero-actions">
          <button
            className="pill"
            type="button"
            onClick={() => {
              track('app_opened');
              showToast({
                message: `Hoje é ${formatMemoryDate(new Date())}.`,
                variant: 'info',
              });
            }}
          >
            Abrir saudação
          </button>
        </div>
      </section>
    </main>
  );
}
