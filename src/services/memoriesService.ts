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

export type UpdateMemoryRequest = {
  title?: string;
  content: string;
  isImportant: boolean;
  dateType?: DateType;
  eventDate?: string;
  eventYear?: number;
  age?: number;
  clearDateInformation?: boolean;
};

export type UpdateMemoryResponse = {
  memoryId: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  isImportant: boolean;
  clientRequestId?: string | null;
  eventDate?: string | null;
  eventYear?: number | null;
  dateType?: string | null;
  age?: number | null;
  isDateInferred?: boolean;
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

export function updateMemory(memoryId: string, payload: UpdateMemoryRequest, userId?: string) {
  return httpClient<UpdateMemoryResponse>(`/api/memories/${memoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    userId,
  });
}

export function deleteMemory(memoryId: string, userId?: string) {
  return httpClient<void>(`/api/memories/${memoryId}`, {
    method: 'DELETE',
    userId,
  });
}
