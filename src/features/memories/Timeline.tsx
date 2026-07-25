import { useCallback, useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { KebabMenu } from '../../components/KebabMenu';
import { LoadingState } from '../../components/LoadingState';
import { formatDateTag } from '../../lib/date/formatDateTag';
import { deriveTitle } from '../../lib/text/deriveTitle';
import type { MemoryUI } from '../../types/memory';

type TimelineProps = {
  memories: MemoryUI[];
  allMemories: MemoryUI[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  hasMemoriesData: boolean;
  onOpenEdit: (memory: MemoryUI) => void;
  onOpenDelete: (memory: MemoryUI) => void;
  onRetry: (memory: MemoryUI) => void;
  createMemoryMutationPending: boolean;
};

const INITIAL_VISIBLE_MEMORIES = 10;
const INCREMENT_MEMORIES = 10;

function getDisplayTitle(memory: MemoryUI): string {
  if (memory.title && memory.title.trim() && memory.title !== 'Sem título') {
    return memory.title;
  }
  return deriveTitle(memory.content);
}

export function Timeline({
  memories,
  allMemories,
  isLoading,
  isFetching,
  isError,
  hasMemoriesData,
  onOpenEdit,
  onOpenDelete,
  onRetry,
  createMemoryMutationPending,
}: TimelineProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_MEMORIES);
  const handleShowMore = useCallback(() => {
    setVisibleCount((prev) => prev + INCREMENT_MEMORIES);
  }, []);

  const visibleMemories = useMemo(() => {
    return memories.slice(0, visibleCount);
  }, [memories, visibleCount]);

  const hasMoreMemories = allMemories.length > visibleMemories.length;

  const successMemories = useMemo(() => memories.filter((m) => m.status === 'success'), [memories]);

  return (
    <section className="panel-card panel-card-span">
      <Header
        title="Timeline"
        subtitle={
          isFetching
            ? 'Atualizando...'
            : isLoading || !hasMemoriesData
              ? 'Carregando...'
              : `${successMemories.length} memórias`
        }
      />
      {isLoading || (!hasMemoriesData && !isError) ? (
        <LoadingState label="Carregando memórias..." />
      ) : isError ? (
        <EmptyState title="Não foi possível carregar a timeline." description="Verifique sua conexão e tente novamente." />
      ) : allMemories.length === 0 ? (
        <EmptyState
          title="Sua timeline está vazia."
          description="Registre sua primeira memória para começar sua história."
        />
      ) : (
        <>
          <ul className="timeline-list">
            {visibleMemories.map((memory) => (
              <li key={memory.id} className={`timeline-item timeline-item--${memory.status}`}>
                <div className="timeline-item-header">
                  <div className="timeline-item-header__left">
                    <strong>{getDisplayTitle(memory)}</strong>
                    {formatDateTag(memory) && (
                      <span className="timeline-item-tag">{formatDateTag(memory)}</span>
                    )}
                  </div>
                  <div className="timeline-item-header__right">
                    {memory.status === 'success' ? (
                      <KebabMenu onEdit={() => onOpenEdit(memory)} onDelete={() => onOpenDelete(memory)} />
                    ) : null}
                  </div>
                </div>
                {memory.isValidationError ? null : <p>{memory.content}</p>}
                {memory.status === 'pending' ? <span className="timeline-status timeline-status--pending">Guardando...</span> : null}
                {memory.status === 'error' && memory.isValidationError ? (
                  <div className="timeline-error timeline-error--validation">
                    <p className="timeline-error__msg">{memory.errorMessage ?? 'Não foi possível guardar sua memória.'}</p>
                  </div>
                ) : null}
                {memory.status === 'error' && !memory.isValidationError ? (
                  <div className="timeline-error">
                    <p className="timeline-error__msg">{memory.errorMessage ?? 'Não foi possível guardar sua memória.'}</p>
                    {memory.isRetryable ? (
                      <div className="timeline-error__actions">
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={createMemoryMutationPending}
                          onClick={() => onRetry(memory)}
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {hasMoreMemories ? (
            <div className="timeline-show-more">
              <Button type="button" onClick={handleShowMore}>
                Ver mais memórias ({allMemories.length - visibleMemories.length} restantes)
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
