import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useAuth } from '../auth/AuthProvider';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const MAX_MEMORIES_VISIBLE = 50;
const MAX_TITLE_LENGTH = 120;

export function HomePage() {
  const { showToast } = useToast();
  const { userId, isReady } = useAuth();
  const createMemoryMutation = useCreateMemory();
  const memoriesQuery = useMemoriesTimeline(userId);
  const storyQuery = useMyStory(userId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const hasTrackedAppOpen = useRef(false);

  useEffect(() => {
    if (hasTrackedAppOpen.current) {
      return;
    }

    track('app_opened');
    hasTrackedAppOpen.current = true;
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const memories = useMemo(() => {
    return sortMemories(memoriesQuery.data?.memories ?? []).slice(0, MAX_MEMORIES_VISIBLE);
  }, [memoriesQuery.data?.memories]);

  const handleRefresh = () => {
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

  const handleInstallApp = async () => {
    if (!installPromptEvent) {
      showToast({
        message: 'A instalação ainda não está disponível neste navegador.',
        variant: 'info',
      });
      return;
    }

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;

    if (choice.outcome === 'accepted') {
      showToast({
        message: 'App instalado com sucesso.',
        variant: 'success',
      });
    }

    setInstallPromptEvent(null);
  };

  const isRefreshing = memoriesQuery.isFetching || storyQuery.isFetching;
  const canSubmit = Boolean(content.trim()) && !createMemoryMutation.isPending;

  if (!isReady) {
    return (
      <main className="page-shell">
        <Container>
          <Card className="hero-card">
            <LoadingState label="Preparando sua história..." />
          </Card>
        </Container>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Container>
        <Card className="hero-card">
          <Header
            title="Bem-vindo ao MakeMyHistory"
            subtitle="Registre memórias, acompanhe sua timeline e acompanhe sua história pessoal."
            action={
              <div className="section-actions">
                <Badge variant="default">MVP</Badge>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!installPromptEvent}
                  onClick={handleInstallApp}
                >
                  {installPromptEvent ? 'Instalar app' : 'Instalação indisponível'}
                </Button>
              </div>
            }
          />

          <div className="content-grid">
            <section className="panel-card">
              <Header title="Nova memória" subtitle="Fluxo principal" />
              <div className="memory-form">
                <label className="input-field" htmlFor="memory-title">
                  <span className="input-field__label">Título opcional</span>
                  <input
                    id="memory-title"
                    className="input"
                    type="text"
                    value={title}
                    placeholder="Ex.: Viagem para o litoral"
                    maxLength={MAX_TITLE_LENGTH}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>

                <div className="input-footer">
                  <span className="timeline-count">
                    {title.length} / {MAX_TITLE_LENGTH}
                  </span>
                </div>

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
                          userId,
                          title: title.trim() || undefined,
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
                            setTitle('');
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
                                userId,
                                title: memory.title,
                                content: memory.content,
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
        </Card>
      </Container>
    </main>
  );
}
