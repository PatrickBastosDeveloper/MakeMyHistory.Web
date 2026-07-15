export type StoryResponse = {
  story?: {
    content: string;
    title?: string;
    memoryCount?: number;
    updatedAt?: string;
  };
  totalMemories?: number;
  isOutOfSync?: boolean;
};
