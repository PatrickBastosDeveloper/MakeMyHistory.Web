import { httpClient } from './httpClient';
import type { StoryResponse } from '../types/story';

export function getMyStory() {
  return httpClient<StoryResponse>('/api/stories/me');
}
