import type { MemoryUI } from '../../types/memory';

export function sortMemories(memories: MemoryUI[]) {
  return [...memories].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
