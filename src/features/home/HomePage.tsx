import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Container } from '../../components/Container';
import { Header } from '../../components/Header';
import { ShareMenu } from '../../components/ShareMenu';
import { LoadingState } from '../../components/LoadingState';
import { formatMemoryDate } from '../../lib/date/formatMemoryDate';
import { track } from '../../lib/track/track';
import { useToast } from '../../lib/toast/useToast';
import { useCreateMemory } from '../../hooks/useCreateMemory';
import { useDeleteMemory } from '../../hooks/useDeleteMemory';
import { useMemoriesTimeline } from '../../hooks/useMemoriesTimeline';
import { useUpdateMemory } from '../../hooks/useUpdateMemory';
import { useUserProfile, useSaveUserProfile } from '../../hooks/useUserProfile';
import { useAuth } from '../auth/AuthProvider';
import { OnboardingModal } from '../auth/OnboardingModal';
import { RecoverModal } from '../auth/RecoverModal';
import { CreateMemoryForm } from '../memories/CreateMemoryForm';
import { Timeline } from '../memories/Timeline';
import { StorySection } from '../stories/StorySection';
import { EditMemoryModal } from '../memories/EditMemoryModal';
import { ProfileModal } from '../profile/ProfileModal';
import { useStoryGeneration } from '../stories/useStoryGeneration';
import type { DateType, MemoryUI } from '../../types/memory';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function HomePage() {
  const { showToast } = useToast();
  const { userId, isReady } = useAuth();
  const createMemoryMutation = useCreateMemory();
  const memoriesQuery = useMemoriesTimeline(userId);
  const updateMemoryMutation = useUpdateMemory();
  const deleteMemoryMutation = useDeleteMemory();
  const [formKey, setFormKey] = useState(0);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const hasTrackedAppOpen = useRef(false);

  const allMemories = useMemo(() => {
    return memoriesQuery.data?.memories ?? [];
  }, [memoriesQuery.data?.memories]);

  const memoriesData = memoriesQuery.data?.memories;
  const hasMemoriesData = Array.isArray(memoriesData);

  const {
    state: storyState,
    storyText,
    handleCopyStory,
    handleGenerateStory,
  } = useStoryGeneration(userId, allMemories);

  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  useEffect(() => {
    if (hasTrackedAppOpen.current) return;
    track('app_opened');
    hasTrackedAppOpen.current = true;
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

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
      showToast({ message: 'App instalado com sucesso.', variant: 'success' });
    }
    setInstallPromptEvent(null);
  };

  const profileQuery = useUserProfile(userId);
  const saveProfileMutation = useSaveUserProfile();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [editingMemory, setEditingMemory] = useState<MemoryUI | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingMemory, setDeletingMemory] = useState<MemoryUI | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleCreateMemory = useCallback(
    (payload: {
      userId: string; title?: string; content: string; isImportant: boolean;
      dateType?: DateType; eventDate?: string; eventYear?: number; age?: number; clientRequestId: string;
    }) => {
      if (navigator.onLine === false) {
        showToast({ message: 'Sem conexão. Tente novamente quando estiver online.', variant: 'error' });
        return;
      }
      createMemoryMutation.mutate(payload, {
        onSuccess: () => {
          track('memory_created');
          showToast({ message: `Memória guardada em ${formatMemoryDate(new Date())}.`, variant: 'success' });
          setFormKey((k) => k + 1);
        },
        onError: (error) => {
          const msg = error && typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : 'Não foi possível guardar sua memória.';
          showToast({ message: msg, variant: 'error' });
        },
      });
    },
    [userId, createMemoryMutation, showToast],
  );

  const handleRetryMemory = useCallback(
    (memory: MemoryUI) => {
      track('retry_clicked');
      createMemoryMutation.mutate({
        userId,
        title: memory.title,
        content: memory.content,
        eventDate: memory.eventDate,
        eventYear: memory.eventYear,
        clientRequestId: memory.clientRequestId ?? crypto.randomUUID(),
      });
    },
    [userId, createMemoryMutation],
  );

  const handleOpenEdit = useCallback((memory: MemoryUI) => {
    if (memory.status === 'pending') return;
    setEditingMemory(memory);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingMemory(null);
  }, []);

  const handleSaveEdit = useCallback(
    (payload: { title?: string; content: string; isImportant: boolean; dateType?: DateType; eventDate?: string; eventYear?: number; age?: number }) => {
      if (!editingMemory) return;
      updateMemoryMutation.mutate(
        { memoryId: editingMemory.id.startsWith('temp-') ? '' : editingMemory.id, userId, payload },
        {
          onSuccess: () => {
            showToast({ message: 'Memória atualizada.', variant: 'success' });
            handleCloseEdit();
          },
          onError: (error) => {
            const msg = error && typeof error === 'object' && 'message' in error
              ? (error as { message: string }).message
              : 'Não foi possível atualizar a memória.';
            showToast({ message: msg, variant: 'error' });
          },
        },
      );
    },
    [editingMemory, userId, updateMemoryMutation, showToast, handleCloseEdit],
  );

  const handleOpenDelete = useCallback((memory: MemoryUI) => {
    if (memory.status === 'pending') return;
    setDeletingMemory(memory);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setDeletingMemory(null);
  }, []);

  const { recoveryCode, showRecoveryBanner, dismissRecoveryBanner } = useAuth();
  const [isRecoverModalOpen, setIsRecoverModalOpen] = useState(false);

  const handleOpenProfile = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const handleRecovered = useCallback(
    (newUserId: string) => {
      // Save the recovered userId and reload the page so AuthProvider re-initializes
      window.localStorage.setItem('userId', newUserId);
      window.location.reload();
    },
    [],
  );

  const handleSaveProfile = useCallback(
    (data: { name: string; birthDate: string }) => {
      saveProfileMutation.mutate(
        { userId, ...data },
        {
          onSuccess: () => {
            showToast({ message: 'Perfil atualizado com sucesso.', variant: 'success' });
            setIsProfileModalOpen(false);
          },
          onError: (error) => {
            const msg =
              error && typeof error === 'object' && 'message' in error
                ? (error as { message: string }).message
                : 'Não foi possível salvar o perfil.';
            showToast({ message: msg, variant: 'error' });
          },
        },
      );
    },
    [userId, saveProfileMutation, showToast],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deletingMemory) return;
    deleteMemoryMutation.mutate(
      { memoryId: deletingMemory.id.startsWith('temp-') ? '' : deletingMemory.id, userId },
      {
        onSuccess: () => {
          showToast({ message: 'Memória excluída.', variant: 'success' });
          handleCloseDelete();
        },
        onError: (error) => {
          const msg = error && typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : 'Não foi possível excluir a memória.';
          showToast({ message: msg, variant: 'error' });
        },
      },
    );
  }, [deletingMemory, userId, deleteMemoryMutation, showToast, handleCloseDelete]);

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
                  onClick={handleOpenProfile}
                >
                  {profileQuery.data?.name ?? 'Editar perfil'}
                </Button>
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

          <div className="home-layout">
            <div className="home-layout__row home-layout__row--top">
              <CreateMemoryForm
                key={formKey}
                userId={userId}
                isPending={createMemoryMutation.isPending}
                onSave={handleCreateMemory}
              />

              <StorySection
                successMemories={storyState.successMemories}
                hasStory={storyState.hasStory}
                storyTitle={storyState.storyTitle}
                storyContent={storyState.storyContent}
                storyMemoryCount={storyState.storyMemoryCount}
                storyUpdatedAt={storyState.storyUpdatedAt}
                isOutOfSync={storyState.isOutOfSync}
                isGenerating={storyState.isGenerating}
                isInsufficient={storyState.isInsufficient}
                firstStorySeen={storyState.firstStorySeen}
                onCopy={handleCopyStory}
                onShare={() => setIsShareMenuOpen(true)}
                onGenerate={handleGenerateStory}
              />
            </div>

            <div className="home-layout__row home-layout__row--bottom">
              <Timeline
                memories={allMemories}
                allMemories={allMemories}
                isLoading={memoriesQuery.isLoading}
                isFetching={memoriesQuery.isFetching}
                isError={memoriesQuery.isError}
                hasMemoriesData={hasMemoriesData}
                onOpenEdit={handleOpenEdit}
                onOpenDelete={handleOpenDelete}
                onRetry={handleRetryMemory}
                createMemoryMutationPending={createMemoryMutation.isPending}
              />
            </div>
          </div>
        </Card>
      </Container>

      <EditMemoryModal
        memory={editingMemory}
        isOpen={isEditModalOpen}
        isSaving={updateMemoryMutation.isPending}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
      />
      {showRecoveryBanner && recoveryCode ? (
        <OnboardingModal
          recoveryCode={recoveryCode}
          onDismiss={dismissRecoveryBanner}
        />
      ) : null}

      <div className="section-actions" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsRecoverModalOpen(true)}
        >
          Recuperar conta
        </Button>
      </div>

      <RecoverModal
        isOpen={isRecoverModalOpen}
        onClose={() => setIsRecoverModalOpen(false)}
        onRecovered={handleRecovered}
      />

      <ShareMenu
        isOpen={isShareMenuOpen}
        title={storyState.storyTitle ?? ''}
        text={storyText}
        onClose={() => setIsShareMenuOpen(false)}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        profile={profileQuery.data}
        isSaving={saveProfileMutation.isPending}
        onClose={handleCloseProfile}
        onSave={handleSaveProfile}
      />
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Excluir memória"
        message={deletingMemory ? `Tem certeza que deseja excluir a memória "${deletingMemory.title || 'Sem título'}"? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteMemoryMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDelete}
      />
    </main>
  );
}
