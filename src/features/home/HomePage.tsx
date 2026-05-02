import { useState } from 'react';
import { formatMemoryDate } from '../../lib/date/formatMemoryDate';
import { track } from '../../lib/track/track';
import { useToast } from '../../lib/toast/useToast';
import { useCreateMemory } from '../../hooks/useCreateMemory';
import { useMemoriesTimeline } from '../../hooks/useMemoriesTimeline';
import { useMyStory } from '../../hooks/useMyStory';

const DEMO_USER_ID = 'demo-user-id';

export function HomePage() {
  const { showToast } = useToast();
  const createMemoryMutation = useCreateMemory();
  const memoriesQuery = useMemoriesTimeline(DEMO_USER_ID);
  const storyQuery = useMyStory(DEMO_USER_ID);
  const [content, setContent] = useState('');

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
                onChange={(event) => setContent(event.target.value)}
                rows={4}
              />

              <div className="hero-actions">
                <button
                  className="pill"
                  type="button"
                  disabled={createMemoryMutation.isPending || !content.trim()}
                  onClick={() => {
                    if (!content.trim() || createMemoryMutation.isPending) {
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
              <span className="timeline-count">
                {memoriesQuery.isLoading ? 'Carregando...' : `${memoriesQuery.data?.memories.length ?? 0} memórias`}
              </span>
            </div>

            {memoriesQuery.isLoading ? (
              <p className="timeline-state">Carregando memórias...</p>
            ) : memoriesQuery.isError ? (
              <p className="timeline-state">Não foi possível carregar a timeline.</p>
            ) : (memoriesQuery.data?.memories.length ?? 0) === 0 ? (
              <p className="timeline-state">Sua timeline está vazia. Escreva a primeira memória.</p>
            ) : (
              <ul className="timeline-list">
                {memoriesQuery.data?.memories.map((memory) => (
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
              <span className="timeline-count">Leitura pessoal</span>
            </div>

            {storyQuery.isLoading ? (
              <p className="timeline-state">Estamos escrevendo sua história...</p>
            ) : storyQuery.isError ? (
              <p className="timeline-state">Não foi possível carregar sua história.</p>
            ) : storyQuery.data?.story ? (
              <article className="story-card">
                <p>{storyQuery.data.story.content}</p>
              </article>
            ) : (
              <p className="timeline-state">Ainda não existe história gerada para você.</p>
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
