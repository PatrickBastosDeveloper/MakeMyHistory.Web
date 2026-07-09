import { httpClient } from './httpClient';
import type { DateType, MemoryUI } from '../types/memory';

export type CreateMemoryRequest = {
  title?: string;
  content: string;
  dateType?: DateType;
  eventDate?: string;
  eventYear?: number;
  age?: number;
  clientRequestId: string;
};

export type CreateMemoryResponse = {
  memoryId: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  isImportant: boolean;
  clientRequestId?: string | null;
  eventDate?: string | null;
  eventYear?: number | null;
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
