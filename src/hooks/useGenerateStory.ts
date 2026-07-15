import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { generateStory } from '../services/storyService';

type GenerateStoryInput = {
  userId: string;
};

export function useGenerateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: GenerateStoryInput) => {
      return generateStory(userId);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.story.me(variables.userId),
      });
    },
  });
}
