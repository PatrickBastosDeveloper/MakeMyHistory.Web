import type { MemoryUI } from '../../types/memory';

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatDateTag(memory: MemoryUI): string | null {
  const { dateType, eventDate, eventYear, age } = memory;

  if (!dateType) return null;

  switch (dateType) {
    case 'FullDate':
      if (eventDate) {
        return `📅 ${formatDate(eventDate)}`;
      }
      return null;

    case 'YearOnly':
      if (eventYear) {
        return `🗓️ ${eventYear}`;
      }
      return null;

    case 'Age':
      if (age !== undefined && age !== null) {
        return `🎂 ${age} anos`;
      }
      return null;

    default:
      return null;
  }
}
