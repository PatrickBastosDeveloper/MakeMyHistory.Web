import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getMyStory } from '../services/storyService';

let storyRenderCount = 0;

export function useMyStory(userId: string) {
  const result = useQuery({
    queryKey: queryKeys.story.me(userId),
    queryFn: () => getMyStory(userId),
    enabled: Boolean(userId),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });

  storyRenderCount++;
  if (result.isRefetching || result.isFetching) {
    console.log(`[story-flow] ${new Date().toISOString()} useMyStory FETCHING/REFETCHING render#=${storyRenderCount} hasData=${!!result.data} isRefetching=${result.isRefetching} isFetching=${result.isFetching}`);
  } else if (result.data) {
    console.log(`[story-flow] ${new Date().toISOString()} useMyStory DATA render#=${storyRenderCount} hasStory=${!!result.data.story} storyLen=${result.data.story?.content?.length ?? 0}`);
  } else {
    console.log(`[story-flow] ${new Date().toISOString()} useMyStory EMPTY/LOADING render#=${storyRenderCount} isLoading=${result.isLoading}`);
  }

  return result;
}

export function useStoryGenerationStatus(userId: string, memoriesCount: number) {
  return useQuery({
    queryKey: queryKeys.story.me(userId),
    queryFn: () => getMyStory(userId),
    enabled: Boolean(userId) && memoriesCount >= 3,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });
}
