import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getMemories } from '../services/memoriesService';

const DEFAULT_LIMIT = 50;

export function useMemoriesTimeline(userId: string) {
  return useQuery({
    queryKey: queryKeys.memories.timeline(userId),
    queryFn: () => getMemories(DEFAULT_LIMIT),
    enabled: Boolean(userId),
  });
}
