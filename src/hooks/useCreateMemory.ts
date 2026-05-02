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

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId: _userId, ...payload }: CreateMemoryInput) => {
      return createMemory(payload);
    },
    onMutate: async ({ userId, ...payload }) => {
      const queryKey = queryKeys.memories.timeline(userId);

      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<{ memories: MemoryUI[] }>(queryKey);
      const optimisticMemory = createOptimisticMemory(payload);

      queryClient.setQueryData<{ memories: MemoryUI[] }>(queryKey, (current) => {
        const memories = current?.memories ?? [];

        return {
          memories: [optimisticMemory, ...memories],
        };
      });

      return { previous, userId };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData(queryKeys.memories.timeline(context.userId), context.previous);
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
                ...response.memory,
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
