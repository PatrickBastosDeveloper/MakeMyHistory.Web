import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Container } from '../../components/Container';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { LoadingState } from '../../components/LoadingState';
import { TextArea } from '../../components/TextArea';
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
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  useEffect(() => {
    track('app_opened');
  }, []);

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

  const handleGenerateStory = () => {
    track('story_generate_clicked');
    setIsGeneratingStory(true);
    void storyQuery.refetch().finally(() => {
      setIsGeneratingStory(false);
    });
  };

  const isRefreshing = memoriesQuery.isFetching || storyQuery.isFetching;
  const canSubmit = Boolean(content.trim()) && !createMemoryMutation.isPending;

  return (
    <main className="page-shell">
      <Container>
        <Card className="hero-card">
          <Header
            title="Bem-vindo ao MakeMyHistory"
            subtitle="Registre memórias, acompanhe sua timeline e acompanhe sua história pessoal."
            action={<Badge variant="default">MVP</Badge>}
          />

          <div className="content-grid">
            <section className="panel-card">
              <Header title="Nova memória" subtitle="Fluxo principal" />
              <div className="memory-form">
                <TextArea
                  id="memory-content"
                  label="Conteúdo"
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
                  <Button
                    type="button"
                    disabled={!canSubmit}
                    onClick={() => {
                      if (!canSubmit) {
                        return;
                      }

                      if (navigator.onLine === false) {
                        showToast({
                          message: 'Sem conexão. Tente novamente quando estiver online.',
                          variant: 'error',
                        });
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
                  </Button>
                </div>
              </div>
            </section>

            <section className="panel-card">
              <Header
                title="Timeline"
                subtitle={
                  memoriesQuery.isFetching
                    ? 'Atualizando...'
                    : memoriesQuery.isLoading
                      ? 'Carregando...'
                      : `${memories.length} memórias`
                }
                action={
                  <Button type="button" variant="ghost" disabled={isRefreshing} onClick={() => void memoriesQuery.refetch()}>
                    Recarregar
                  </Button>
                }
              />

              {memoriesQuery.isLoading ? (
                <LoadingState label="Carregando memórias..." />
              ) : memoriesQuery.isError ? (
                <EmptyState
                  title="Não foi possível carregar a timeline."
                  description="Verifique sua conexão e tente novamente."
                />
              ) : memories.length === 0 ? (
                <EmptyState
                  title="Sua timeline está vazia. Escreva a primeira memória."
                  description="Use o card à esquerda para começar a preencher sua história."
                />
              ) : (
                <ul className="timeline-list">
                  {memories.map((memory) => (
                    <li key={memory.id} className={`timeline-item timeline-item--${memory.status}`}>
                      <div className="timeline-item-header">
                        <strong>{memory.title ?? 'Memória sem título'}</strong>
                        <span>{formatMemoryDate(memory.createdAt)}</span>
                      </div>
                      <p>{memory.content}</p>
                      {memory.status === 'pending' ? (
                        <span className="timeline-status timeline-status--pending">Guardando...</span>
                      ) : null}
                      {memory.status === 'error' ? (
                        <div className="timeline-error-actions">
                          <span className="timeline-status timeline-status--error">
                            Não foi possível guardar
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={createMemoryMutation.isPending}
                            onClick={() => {
                              track('retry_clicked');
                              createMemoryMutation.mutate({
                                userId: DEMO_USER_ID,
                                content: memory.content,
                                title: memory.title,
                                eventDate: memory.eventDate,
                                eventYear: memory.eventYear,
                                clientRequestId: memory.clientRequestId ?? crypto.randomUUID(),
                              });
                            }}
                          >
                            Tentar novamente
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel-card panel-card-span">
              <Header
                title="Sua história"
                subtitle={storyQuery.isFetching ? 'Atualizando...' : 'Leitura pessoal'}
                action={
                  <Button type="button" variant="ghost" disabled={isRefreshing} onClick={handleRefresh}>
                    Atualizar
                  </Button>
                }
              />

              {storyQuery.isLoading ? (
                <LoadingState label="Estamos escrevendo sua história..." />
              ) : storyQuery.isError ? (
                <EmptyState
                  title="Não foi possível carregar sua história."
                  description="Tente recarregar quando a conexão estiver estável."
                />
              ) : storyQuery.data?.story ? (
                <article className="story-card">
                  <p>{storyQuery.data.story.content}</p>
                  <div className="hero-actions">
                    <Button
                      type="button"
                      disabled={storyQuery.isFetching || isGeneratingStory}
                      onClick={handleGenerateStory}
                    >
                      {storyQuery.isFetching || isGeneratingStory
                        ? 'Escrevendo sua história...'
                        : 'Atualizar história'}
                    </Button>
                  </div>
                </article>
              ) : (
                <EmptyState
                  title="Ainda não existe história gerada para você."
                  description="Registre algumas memórias para começar a construir a narrativa pessoal."
                />
              )}
            </section>
          </div>

          <div className="hero-actions">
            <Button
              type="button"
              onClick={() => {
                showToast({
                  message: `Hoje é ${formatMemoryDate(new Date())}.`,
                  variant: 'info',
                });
              }}
            >
              Abrir saudação
            </Button>
          </div>
        </Card>
      </Container>
    </main>
  );
}
