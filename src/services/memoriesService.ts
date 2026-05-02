import { httpClient } from './httpClient';
import type { Memory } from '../types/memory';

export type CreateMemoryRequest = {
  title?: string;
  content: string;
  eventDate?: string;
  eventYear?: number;
  clientRequestId: string;
};

export type CreateMemoryResponse = {
  memory: Memory;
};

export type MemoriesListResponse = {
  memories: Memory[];
};

export function getMemories(limit: number) {
  return httpClient<MemoriesListResponse>(`/api/memories?limit=${limit}`);
}

export function createMemory(payload: CreateMemoryRequest) {
  return httpClient<CreateMemoryResponse>('/api/memories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
