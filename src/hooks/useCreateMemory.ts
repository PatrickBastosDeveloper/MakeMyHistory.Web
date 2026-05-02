import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { createMemory, type CreateMemoryRequest } from '../services/memoriesService';

type CreateMemoryInput = CreateMemoryRequest & {
  userId: string;
};

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId: _userId, ...payload }: CreateMemoryInput) => {
      return createMemory(payload);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memories.timeline(variables.userId),
      });
    },
  });
}
