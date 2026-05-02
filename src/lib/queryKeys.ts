export const queryKeys = {
  memories: {
    timeline: (userId: string) => ['memories', 'timeline', userId] as const,
  },
  story: {
    me: (userId: string) => ['story', 'me', userId] as const,
  },
};
