export type MemoryStatus = 'pending' | 'success' | 'error';

export type Memory = {
  id: string;
  title?: string;
  content: string;
  eventDate?: string;
  eventYear?: number;
  createdAt: string;
};

export type MemoryUI = Memory & {
  status: MemoryStatus;
  clientRequestId?: string;
  tempId?: string;
};
