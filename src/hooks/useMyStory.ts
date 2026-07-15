import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getMyStory } from '../services/storyService';

export function useMyStory(userId: string) {
  return useQuery({
    queryKey: queryKeys.story.me(userId),
    queryFn: () => getMyStory(userId),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useStoryGenerationStatus(userId: string, memoriesCount: number) {
  return useQuery({
    queryKey: queryKeys.story.me(userId),
    queryFn: () => getMyStory(userId),
    enabled: Boolean(userId) && memoriesCount >= 3,
    retry: false,
  });
}
