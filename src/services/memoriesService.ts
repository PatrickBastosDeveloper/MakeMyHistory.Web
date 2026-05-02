import { httpClient } from './httpClient';
import type { MemoryUI } from '../types/memory';

export type CreateMemoryRequest = {
  title?: string;
  content: string;
  eventDate?: string;
  eventYear?: number;
  clientRequestId: string;
};

export type CreateMemoryResponse = {
  memory: MemoryUI;
};

export type MemoriesListResponse = {
  memories: MemoryUI[];
};

export function getMemories(limit: number, userId?: string) {
  return httpClient<MemoriesListResponse>(`/api/memories?limit=${limit}`, {
    userId,
  });
}

export function createMemory(payload: CreateMemoryRequest, userId?: string) {
  return httpClient<CreateMemoryResponse>('/api/memories', {
    method: 'POST',
    body: JSON.stringify(payload),
    userId,
  });
}
