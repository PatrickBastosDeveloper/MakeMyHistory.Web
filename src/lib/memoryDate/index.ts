const currentYear = new Date().getFullYear();

export type DateValues = {
  FullDate: string;
  YearOnly: string;
  Age: string;
};

export const EMPTY_DATE_VALUES: DateValues = { FullDate: '', YearOnly: '', Age: '' };

export function validateFullDate(value: string): string | null {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) return 'Use o formato dd/mm/aaaa.';
  const year = parseInt(parts[2], 10);
  if (year < 1900 || year > currentYear) return `O ano deve estar entre 1900 e ${currentYear}.`;
  const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  if (date > new Date()) return 'A data informada é futura.';
  return null;
}

export function validateYearOnly(value: string): string | null {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return 'Use apenas números.';
  const y = Number(value);
  if (y < 1900 || y > currentYear) return `O ano deve estar entre 1900 e ${currentYear}.`;
  return null;
}

export function validateAge(value: string): string | null {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return 'Use apenas números.';
  const a = Number(value);
  if (a < 0 || a > 120) return 'A idade deve ser entre 0 e 120.';
  return null;
}

/** Converts aaaa-mm-dd (API format) → dd/mm/aaaa for display in inputs */
export function formatStoredDateToInput(eventDate?: string): string {
  if (!eventDate) return '';
  const parts = eventDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return eventDate;
}

/** Auto-format dd/mm/yyyy with slash insertion as user types */
export function autoFormatFullDate(raw: string, previousLength: number): string {
  const digits = raw.replace(/[^\d/]/g, '');
  let formatted = digits;
  if (digits.length === 2 && !digits.includes('/') && previousLength < 2) formatted = digits + '/';
  else if (digits.length === 5 && digits[2] === '/' && !digits.slice(3).includes('/') && previousLength < 5) formatted = digits + '/';
  return formatted;
}

/**
 * Returns the date error for a given date type and its values.
 * Returns null when type is null or value is empty (no error).
 */
export function getDateError(dateType: string | null, dateValues: DateValues): string | null {
  if (!dateType) return null;
  switch (dateType) {
    case 'FullDate': return validateFullDate(dateValues.FullDate);
    case 'YearOnly': return validateYearOnly(dateValues.YearOnly);
    case 'Age': return validateAge(dateValues.Age);
    default: return null;
  }
}
