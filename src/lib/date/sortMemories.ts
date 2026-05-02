import type { Memory } from '../../types/memory';

export function sortMemories(memories: Memory[]) {
  return [...memories].sort((a, b) => {
    if (a.eventDate && b.eventDate) {
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    }

    if (a.eventDate) return -1;
    if (b.eventDate) return 1;

    if (a.eventYear && b.eventYear) {
      return b.eventYear - a.eventYear;
    }

    if (a.eventYear) return -1;
    if (b.eventYear) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
