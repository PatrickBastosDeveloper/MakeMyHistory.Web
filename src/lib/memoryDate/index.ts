const CURRENT_YEAR = new Date().getFullYear();

export const MIN_YEAR = 1900;
export const MAX_AGE = 120;

export type DateValues = {
  FullDate: string;
  YearOnly: string;
  Age: string;
};

export const EMPTY_DATE_VALUES: DateValues = { FullDate: '', YearOnly: '', Age: '' };

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Interpreta a data de nascimento no formato da API (aaaa-mm-dd).
 * Retorna null quando ausente ou inválida — nesse caso nenhuma regra de
 * consistência temporal é aplicada no frontend.
 */
export function parseBirthDate(birthDate?: string | null): Date | null {
  if (!birthDate) return null;

  const parts = birthDate.split('-');
  if (parts.length !== 3) return null;

  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return startOfDay(date);
}

/** Idade completa em anos, considerando mês e dia do aniversário. */
export function calculateAge(birthDate: Date, referenceDate: Date): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();

  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

/**
 * Espelha as regras de `DateValidation` no backend: formato exato, data real
 * do calendário, faixa de anos, não futura e não anterior ao nascimento.
 * Sempre retorna null para campo vazio — a obrigatoriedade é tratada à parte.
 */
export function validateFullDate(value: string, birthDate?: string | null): string | null {
  if (!value) return null;

  const parts = value.split('/');
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) return 'Use o formato dd/mm/aaaa.';

  const [dayStr, monthStr, yearStr] = parts;
  if (dayStr.length !== 2 || monthStr.length !== 2 || yearStr.length !== 4) {
    return 'Use o formato dd/mm/aaaa.';
  }

  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  // Rejeita datas impossíveis: o JS "rola" 31/02/2020 para 02/03/2020.
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return 'Data informada é inválida.';
  }

  if (year < MIN_YEAR || year > CURRENT_YEAR) {
    return `O ano deve estar entre ${MIN_YEAR} e ${CURRENT_YEAR}.`;
  }

  const date = startOfDay(parsed);
  if (date > startOfDay(new Date())) return 'A data informada é futura.';

  const birth = parseBirthDate(birthDate);
  if (birth && date < birth) return 'Data informada é anterior à sua data de nascimento.';

  return null;
}

export function validateYearOnly(value: string, birthDate?: string | null): string | null {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return 'Use apenas números.';

  const year = Number(value);
  if (year < MIN_YEAR || year > CURRENT_YEAR) {
    return `O ano deve estar entre ${MIN_YEAR} e ${CURRENT_YEAR}.`;
  }

  const birth = parseBirthDate(birthDate);
  if (birth && year < birth.getFullYear()) {
    return 'Ano informado não é compatível com a data de nascimento.';
  }

  return null;
}

export function validateAge(value: string, birthDate?: string | null): string | null {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return 'Use apenas números.';

  // Política explícita: idade 0 é válida (evento no ano de nascimento).
  const age = Number(value);
  if (age < 0 || age > MAX_AGE) return `A idade deve ser entre 0 e ${MAX_AGE}.`;

  const birth = parseBirthDate(birthDate);
  if (birth && age > calculateAge(birth, new Date())) {
    return 'Idade informada é superior à sua idade atual.';
  }

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
 *
 * Quando a data de nascimento do usuário é conhecida, aplica aqui a mesma
 * consistência temporal exigida pelo backend — o backend segue sendo a regra
 * oficial; isto é apenas UX para evitar o erro só na resposta da API.
 */
export function getDateError(
  dateType: string | null,
  dateValues: DateValues,
  birthDate?: string | null,
): string | null {
  if (!dateType) return null;
  switch (dateType) {
    case 'FullDate': return validateFullDate(dateValues.FullDate, birthDate);
    case 'YearOnly': return validateYearOnly(dateValues.YearOnly, birthDate);
    case 'Age': return validateAge(dateValues.Age, birthDate);
    default: return null;
  }
}
