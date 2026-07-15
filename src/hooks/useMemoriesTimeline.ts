import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { getMemories } from '../services/memoriesService';
import type { MemoryUI } from '../types/memory';

const DEFAULT_LIMIT = 50;

export function useMemoriesTimeline(userId: string) {
  return useQuery({
    queryKey: queryKeys.memories.timeline(userId),
    queryFn: async () => {
      const response = await getMemories(DEFAULT_LIMIT, userId);

      type BackendMemory = {
        id: string;
        title?: string | null;
        content: string;
        createdAt: string;
        clientRequestId?: string | null;
        eventDate?: string | null;
        eventYear?: number | null;
        isImportant?: boolean;
        dateType?: string | null;
        age?: number | null;
        isDateInferred?: boolean | null;
      };

      const anyResponse = response as unknown as { memories?: unknown; Memories?: unknown };
      const rawMemories =
        (anyResponse.memories as BackendMemory[] | undefined) ??
        (anyResponse.Memories as BackendMemory[] | undefined) ??
        [];

      const memories: MemoryUI[] = rawMemories.map((m) => ({
        id: m.id,
        title: (!m.title || m.title === 'Sem título') ? undefined : m.title,
        content: m.content,
        createdAt: m.createdAt,
        eventDate: m.eventDate ?? undefined,
        eventYear: m.eventYear ?? undefined,
        dateType: (m.dateType as any) ?? undefined,
        age: m.age ?? undefined,
        isDateInferred: m.isDateInferred ?? undefined,
        clientRequestId: m.clientRequestId ?? undefined,
        status: 'success',
      }));

      const totalCount = (response as any).totalCount as number | undefined;
      const limit = (response as any).limit as number | undefined;
      const hasMemories = Array.isArray(anyResponse.memories);
      const hasMemoriesCapital = Array.isArray(anyResponse.Memories);

      // eslint-disable-next-line no-console
      console.log(
        `[timeline] userId=${userId} limit=${limit ?? 'null'} totalCount=${totalCount ?? 'null'} memoriesLen=${memories.length} hasMemories=${hasMemories} hasMemoriesCapital=${hasMemoriesCapital}`,
      );

      return {
        memories,
        limit: (response as any).limit,
        totalCount: (response as any).totalCount,
      };
    },
    enabled: Boolean(userId),
  });
}
