import type { DateType } from '../../types/memory';
// Extensão explícita: o runner nativo de testes do Node não resolve imports
// sem extensão, e este módulo é importado direto pelos testes.
import { getTodayApiDate } from './index.ts';
import type { DateValues } from './index.ts';

export type DatePayload = {
  dateType?: DateType;
  eventDate?: string;
  eventYear?: number;
  age?: number;
};

type BuildDatePayloadInput = {
  /** Checkbox "Hoje": grava a data do dispositivo como data completa. */
  today: boolean;
  /** Checkbox "Sem data": não envia nenhum campo de data. */
  noDate: boolean;
  dateType: DateType | null;
  dateValues: DateValues;
  /** Injetável nos testes; em produção é sempre "agora". */
  now?: Date;
};

/**
 * Traduz o estado dos controles de data para o payload da API.
 *
 * "Hoje" é testado primeiro de propósito: é o único estado que grava uma data
 * completa sem nenhum radio selecionado, então num estado inconsistente ele
 * deve vencer — e não cair no ramo que não envia data nenhuma.
 *
 * "Hoje" grava `FullDate` com a data de hoje, não um `dateType` próprio: um
 * modo "hoje" persistido mudaria de significado no dia seguinte.
 */
export function buildDatePayload({
  today,
  noDate,
  dateType,
  dateValues,
  now = new Date(),
}: BuildDatePayloadInput): DatePayload {
  if (today) {
    const todayApi = getTodayApiDate(now);

    return {
      dateType: 'FullDate',
      eventDate: todayApi,
      eventYear: Number(todayApi.slice(0, 4)),
    };
  }

  if (noDate || !dateType) return {};

  if (dateType === 'FullDate' && dateValues.FullDate) {
    const parts = dateValues.FullDate.split('/');
    if (parts.length !== 3) return {};

    const [day, month, yearStr] = parts;

    return {
      dateType: 'FullDate',
      eventDate: `${yearStr}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
      eventYear: Number(yearStr),
    };
  }

  if (dateType === 'YearOnly' && dateValues.YearOnly) {
    return {
      dateType: 'YearOnly',
      eventYear: Number(dateValues.YearOnly),
    };
  }

  if (dateType === 'Age' && dateValues.Age) {
    const age = Number(dateValues.Age);

    return {
      dateType: 'Age',
      age,
      eventYear: now.getFullYear() - age,
    };
  }

  return {};
}
