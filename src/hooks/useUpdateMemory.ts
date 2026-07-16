import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { updateMemory, type UpdateMemoryRequest } from '../services/memoriesService';

type UseUpdateMemoryInput = {
  memoryId: string;
  userId: string;
  payload: UpdateMemoryRequest;
};

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memoryId, userId, payload }: UseUpdateMemoryInput) => {
      return updateMemory(memoryId, payload, userId);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memories.timeline(variables.userId),
      });
    },
  });
}
