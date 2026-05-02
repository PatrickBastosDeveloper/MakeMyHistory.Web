import { httpClient } from './httpClient';
import type { StoryResponse } from '../types/story';

export function getMyStory(userId?: string) {
  return httpClient<StoryResponse>('/api/stories/me', {
    userId,
  });
}
