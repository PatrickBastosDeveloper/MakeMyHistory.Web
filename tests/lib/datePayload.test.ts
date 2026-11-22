import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDatePayload } from '../../src/lib/memoryDate/datePayload.ts';
import { EMPTY_DATE_VALUES } from '../../src/lib/memoryDate/index.ts';
import type { DateValues } from '../../src/lib/memoryDate/index.ts';

/**
 * O payload de data é a única coisa que o campo "Hoje" muda no sistema.
 * Estes testes provam o que o request contém, sem depender de backend.
 */

const NO_VALUES: DateValues = EMPTY_DATE_VALUES;
const FIXED_NOW = new Date(2026, 10, 20, 22, 30);

function values(partial: Partial<DateValues>): DateValues {
  return { ...EMPTY_DATE_VALUES, ...partial };
}

// ── Hoje ──────────────────────────────────────────────────────

test('Hoje grava FullDate com a data de hoje e o ano', () => {
  const payload = buildDatePayload({
    today: true,
    noDate: false,
    dateType: null,
    dateValues: NO_VALUES,
    now: FIXED_NOW,
  });

  assert.deepEqual(payload, {
    dateType: 'FullDate',
    eventDate: '2026-11-20',
    eventYear: 2026,
  });
});

test('Hoje não desloca o dia no fim da noite (UTC-3)', () => {
  const lateNight = new Date(2026, 10, 20, 23, 30);
  const payload = buildDatePayload({
    today: true,
    noDate: false,
    dateType: null,
    dateValues: NO_VALUES,
    now: lateNight,
  });

  assert.equal(payload.eventDate, '2026-11-20');
});

test('Hoje vence um radio preenchido que tenha ficado para trás', () => {
  const payload = buildDatePayload({
    today: true,
    noDate: false,
    dateType: 'Age',
    dateValues: values({ Age: '30' }),
    now: FIXED_NOW,
  });

  assert.deepEqual(payload, {
    dateType: 'FullDate',
    eventDate: '2026-11-20',
    eventYear: 2026,
  });
});

test('Hoje vence "Sem data" num estado inconsistente', () => {
  const payload = buildDatePayload({
    today: true,
    noDate: true,
    dateType: null,
    dateValues: NO_VALUES,
    now: FIXED_NOW,
  });

  assert.equal(payload.dateType, 'FullDate');
  assert.equal(payload.eventDate, '2026-11-20');
});

// ── Sem data / sem seleção ────────────────────────────────────

test('Sem data não envia nenhum campo de data', () => {
  const payload = buildDatePayload({
    today: false,
    noDate: true,
    dateType: 'FullDate',
    dateValues: values({ FullDate: '15/06/2020' }),
    now: FIXED_NOW,
  });

  assert.deepEqual(payload, {});
});

test('Nenhum tipo escolhido não envia data', () => {
  const payload = buildDatePayload({
    today: false,
    noDate: false,
    dateType: null,
    dateValues: NO_VALUES,
    now: FIXED_NOW,
  });

  assert.deepEqual(payload, {});
});

// ── Caminhos que já existiam continuam iguais ─────────────────

test('Data completa converte dd/mm/aaaa para aaaa-mm-dd', () => {
  const payload = buildDatePayload({
    today: false,
    noDate: false,
    dateType: 'FullDate',
    dateValues: values({ FullDate: '05/03/2019' }),
    now: FIXED_NOW,
  });

  assert.deepEqual(payload, {
    dateType: 'FullDate',
    eventDate: '2019-03-05',
    eventYear: 2019,
  });
});

test('Data completa incompleta não envia data', () => {
  const payload = buildDatePayload({
    today: false,
    noDate: false,
    dateType: 'FullDate',
    dateValues: values({ FullDate: '05/03' }),
    now: FIXED_NOW,
  });

  assert.deepEqual(payload, {});
});

test('Apenas ano envia YearOnly com o ano', () => {
  const payload = buildDatePayload({
    today: false,
    noDate: false,
    dateType: 'YearOnly',
    dateValues: values({ YearOnly: '2018' }),
    now: FIXED_NOW,
  });

  assert.deepEqual(payload, {
    dateType: 'YearOnly',
    eventYear: 2018,
  });
});

test('Idade na época deriva o ano a partir de agora', () => {
  const payload = buildDatePayload({
    today: false,
    noDate: false,
    dateType: 'Age',
    dateValues: values({ Age: '20' }),
    now: FIXED_NOW,
  });

  assert.deepEqual(payload, {
    dateType: 'Age',
    age: 20,
    eventYear: 2006,
  });
});

test('Idade na época usa o ano atual, não o ano em que o app carregou', () => {
  const payload = buildDatePayload({
    today: false,
    noDate: false,
    dateType: 'Age',
    dateValues: values({ Age: '20' }),
    now: new Date(2027, 0, 2),
  });

  assert.equal(payload.eventYear, 2007);
});
