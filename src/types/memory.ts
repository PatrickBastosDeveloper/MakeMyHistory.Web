export type MemoryStatus = 'pending' | 'success' | 'error';

export type DateType = 'FullDate' | 'YearOnly' | 'Age';

export type Memory = {
  id: string;
  title?: string;
  content: string;
  dateType?: DateType;
  eventDate?: string;
  eventYear?: number;
  age?: number;
  isDateInferred?: boolean;
  createdAt: string;
};

export type MemoryUI = Memory & {
  status: MemoryStatus;
  clientRequestId?: string;
  tempId?: string;
};
