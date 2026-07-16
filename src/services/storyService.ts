import { httpClient } from './httpClient';
import type { StoryResponse } from '../types/story';

type RawStoryResponse = {
  userId: string;
  story?: string | null;
  title?: string | null;
  memoryCount?: number;
  updatedAt?: string | null;
  hasStory: boolean;
  totalMemories?: number;
  isOutOfSync?: boolean;
};

export async function getMyStory(userId?: string): Promise<StoryResponse> {
  const t0 = performance.now();
  console.log(`[story-flow] ${new Date().toISOString()} getMyStory START userId=${userId}`);
  try {
    const raw = await httpClient<RawStoryResponse>('/api/stories/me', {
      userId,
    });
    const t1 = performance.now();
    console.log(`[story-flow] ${new Date().toISOString()} getMyStory DONE duration=${(t1 - t0).toFixed(0)}ms hasStory=${raw.hasStory} storyLen=${raw.story?.length ?? 0}`);
    if (!raw.hasStory || !raw.story) {
      return { totalMemories: raw.totalMemories };
    }
    return {
      story: {
        content: raw.story,
        title: raw.title ?? undefined,
        memoryCount: raw.memoryCount ?? 0,
        updatedAt: raw.updatedAt ?? undefined,
      },
      totalMemories: raw.totalMemories,
      isOutOfSync: raw.isOutOfSync ?? false,
    };
  } catch (err: unknown) {
    const t1 = performance.now();
    console.log(`[story-flow] ${new Date().toISOString()} getMyStory ERROR duration=${(t1 - t0).toFixed(0)}ms`);
    const appErr = err as { code?: string; message?: string };
    if (appErr.code === '404') {
      return {};
    }
    throw err;
  }
}

type RawGenerateResponse = {
  userId: string;
  story: string;
  title: string;
  memoryCount: number;
  updatedAt: string;
};

export function generateStory(userId?: string): Promise<StoryResponse> {
  const t0 = performance.now();
  console.log(`[story-flow] ${new Date().toISOString()} generateStory START userId=${userId}`);
  return httpClient<RawGenerateResponse>('/api/stories', {
    method: 'POST',
    userId,
  }).then((raw) => {
    const t1 = performance.now();
    console.log(`[story-flow] ${new Date().toISOString()} generateStory DONE duration=${(t1 - t0).toFixed(0)}ms storyLen=${raw.story?.length ?? 0}`);
    return {
      story: {
        content: raw.story,
        title: raw.title,
        memoryCount: raw.memoryCount,
        updatedAt: raw.updatedAt,
      },
    };
  });
}
