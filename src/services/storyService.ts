import { httpClient } from './httpClient';
import type { StoryResponse } from '../types/story';

type RawStoryResponse = {
  userId: string;
  story?: string | null;
  title?: string | null;
  memoryCount?: number;
  lastGeneratedAt?: string | null;
  totalMemories?: number;
  hasStory: boolean;
  isOutOfSync?: boolean;
};

export async function getMyStory(userId?: string): Promise<StoryResponse> {
  try {
    const raw = await httpClient<RawStoryResponse>('/api/stories/me', {
      userId,
    });
    if (!raw.hasStory || !raw.story) {
      return { totalMemories: raw.totalMemories };
    }
    return {
      story: {
        content: raw.story,
        title: raw.title ?? undefined,
        memoryCount: raw.memoryCount ?? 0,
        updatedAt: raw.lastGeneratedAt ?? undefined,
      },
      totalMemories: raw.totalMemories,
      isOutOfSync: raw.isOutOfSync ?? false,
    };
  } catch (err: unknown) {
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
  return httpClient<RawGenerateResponse>('/api/stories', {
    method: 'POST',
    userId,
  }).then((raw) => ({
    story: {
      content: raw.story,
      title: raw.title,
      memoryCount: raw.memoryCount,
      updatedAt: raw.updatedAt,
    },
  }));
}
