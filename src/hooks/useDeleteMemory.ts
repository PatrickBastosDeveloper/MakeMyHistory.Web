import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { deleteMemory } from '../services/memoriesService';

type UseDeleteMemoryInput = {
  memoryId: string;
  userId: string;
};

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memoryId, userId }: UseDeleteMemoryInput) => {
      return deleteMemory(memoryId, userId);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memories.timeline(variables.userId),
      });
    },
  });
}
