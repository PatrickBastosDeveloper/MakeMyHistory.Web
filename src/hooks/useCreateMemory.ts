import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import type { MemoryUI } from '../types/memory';
import { createMemory, type CreateMemoryRequest } from '../services/memoriesService';

type CreateMemoryInput = CreateMemoryRequest & {
  userId: string;
};

function createOptimisticMemory(payload: CreateMemoryRequest) {
  const now = new Date().toISOString();

  return {
    id: `temp-${payload.clientRequestId}`,
    tempId: `temp-${payload.clientRequestId}`,
    clientRequestId: payload.clientRequestId,
    status: 'pending',
    title: payload.title,
    content: payload.content,
    eventDate: payload.eventDate,
    eventYear: payload.eventYear,
    createdAt: now,
  } satisfies MemoryUI;
}

function isDuplicateMemory(existing: MemoryUI, candidate: CreateMemoryRequest) {
  if (existing.clientRequestId === candidate.clientRequestId) {
    return true;
  }

  const sameContent = existing.content.trim() === candidate.content.trim();
  const sameTitle = (existing.title ?? '').trim() === (candidate.title ?? '').trim();
  const timeDiff = Math.abs(new Date(existing.createdAt).getTime() - Date.now());

  return sameContent && sameTitle && timeDiff < 3000;
}

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId: _userId, ...payload }: CreateMemoryInput) => {
      return createMemory(payload, _userId);
    },
    onMutate: async ({ userId, ...payload }) => {
      const queryKey = queryKeys.memories.timeline(userId);

      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<{ memories: MemoryUI[] }>(queryKey);
      const optimisticMemory = createOptimisticMemory(payload);

      queryClient.setQueryData<{ memories: MemoryUI[] }>(queryKey, (current) => {
        const memories = current?.memories ?? [];
        const hasPendingDuplicate = memories.some(
          (memory) => memory.status === 'pending' && isDuplicateMemory(memory, payload),
        );

        if (hasPendingDuplicate) {
          return {
            memories,
          };
        }

        return {
          memories: [optimisticMemory, ...memories],
        };
      });

      return { previous, userId };
    },
    onError: (_error, variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<{ memories: MemoryUI[] }>(
        queryKeys.memories.timeline(context.userId),
        (current) => {
          const memories = current?.memories ?? [];

          return {
            memories: memories.map((memory) => {
              if (memory.clientRequestId !== variables.clientRequestId && memory.tempId !== `temp-${variables.clientRequestId}`) {
                return memory;
              }

              return {
                ...memory,
                status: 'error',
              };
            }),
          };
        },
      );
    },
    onSuccess: (response, variables) => {
      queryClient.setQueryData<{ memories: MemoryUI[] }>(
        queryKeys.memories.timeline(variables.userId),
        (current) => {
          const memories = current?.memories ?? [];

          return {
            memories: memories.map((memory) => {
              if (memory.clientRequestId !== variables.clientRequestId && memory.tempId !== `temp-${variables.clientRequestId}`) {
                return memory;
              }

              return {
                ...memory,
                id: response.memoryId,
                title: response.title,
                content: response.content,
                createdAt: response.createdAt,
                isImportant: response.isImportant,
                eventDate: response.eventDate ?? undefined,
                eventYear: response.eventYear ?? undefined,
                status: 'success',
                clientRequestId: variables.clientRequestId,
                tempId: `temp-${variables.clientRequestId}`,
              };
            }),
          };
        },
      );

      void queryClient.invalidateQueries({
        queryKey: queryKeys.memories.timeline(variables.userId),
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.story.me(variables.userId),
      });
    },
  });
}
