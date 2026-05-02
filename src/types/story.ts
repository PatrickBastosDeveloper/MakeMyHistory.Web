export type Story = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
};

export type StoryResponse = {
  story?: Story;
};
