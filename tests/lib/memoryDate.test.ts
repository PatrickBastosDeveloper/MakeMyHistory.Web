import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAge,
  getDateError,
  parseBirthDate,
  validateAge,
  validateFullDate,
  validateYearOnly,
} from '../../src/lib/memoryDate/index.ts';

/**
 * H9 — a validação de data do frontend é apenas UX, mas precisa espelhar a
 * regra oficial do backend (`DateValidation.cs`) para o usuário não descobrir
 * o erro só na resposta da API.
 */

const BIRTH_1986 = '1986-01-01';

function toDisplay(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

// ── Data completa ─────────────────────────────────────────────

test('validateFullDate aceita data válida dentro da vida do usuário', () => {
  assert.equal(validateFullDate('15/06/2020', BIRTH_1986), null);
});

test('validateFullDate aceita data válida sem data de nascimento conhecida', () => {
  assert.equal(validateFullDate('15/06/2020'), null);
});

test('validateFullDate retorna null para campo vazio', () => {
  assert.equal(validateFullDate(''), null);
});

test('validateFullDate exige o formato dd/mm/aaaa', () => {
  assert.equal(validateFullDate('1/6/2020'), 'Use o formato dd/mm/aaaa.');
  assert.equal(validateFullDate('15-06-2020'), 'Use o formato dd/mm/aaaa.');
});

test('validateFullDate rejeita datas impossíveis do calendário', () => {
  assert.equal(validateFullDate('31/02/2020'), 'Data informada é inválida.');
  assert.equal(validateFullDate('40/01/2020'), 'Data informada é inválida.');
  assert.equal(validateFullDate('10/13/2020'), 'Data informada é inválida.');
});

test('validateFullDate rejeita ano fora da faixa permitida', () => {
  assert.equal(validateFullDate('31/12/1899'), `O ano deve estar entre 1900 e ${new Date().getFullYear()}.`);
  assert.equal(validateFullDate('01/01/2100'), `O ano deve estar entre 1900 e ${new Date().getFullYear()}.`);
});

test('validateFullDate rejeita data futura', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = validateFullDate(toDisplay(tomorrow));

  assert.ok(result, 'data futura deve ser rejeitada');
  if (tomorrow.getFullYear() === new Date().getFullYear()) {
    assert.equal(result, 'A data informada é futura.');
  }
});

test('validateFullDate rejeita data anterior ao nascimento', () => {
  assert.equal(
    validateFullDate('10/05/1970', BIRTH_1986),
    'Data informada é anterior à sua data de nascimento.',
  );
});

// ── Ano ───────────────────────────────────────────────────────

test('validateYearOnly aceita ano compatível com o nascimento', () => {
  assert.equal(validateYearOnly('2018', BIRTH_1986), null);
});

test('validateYearOnly rejeita ano anterior ao nascimento', () => {
  assert.equal(
    validateYearOnly('1970', BIRTH_1986),
    'Ano informado não é compatível com a data de nascimento.',
  );
});

test('validateYearOnly rejeita ano futuro', () => {
  const nextYear = String(new Date().getFullYear() + 1);
  assert.equal(validateYearOnly(nextYear), `O ano deve estar entre 1900 e ${new Date().getFullYear()}.`);
});

test('validateYearOnly rejeita valor não numérico', () => {
  assert.equal(validateYearOnly('abc'), 'Use apenas números.');
});

// ── Idade ─────────────────────────────────────────────────────

test('validateAge aceita idade zero (política explícita)', () => {
  assert.equal(validateAge('0', '2000-01-01'), null);
});

test('validateAge aceita idade dentro da vida do usuário', () => {
  assert.equal(validateAge('20', '2000-01-01'), null);
});

test('validateAge rejeita idade superior à atual', () => {
  assert.equal(
    validateAge('100', '2000-01-01'),
    'Idade informada é superior à sua idade atual.',
  );
});

test('validateAge rejeita valor acima do limite absoluto', () => {
  assert.equal(validateAge('500', '1900-01-01'), 'A idade deve ser entre 0 e 120.');
});

test('validateAge rejeita valor não numérico', () => {
  assert.equal(validateAge('-1'), 'Use apenas números.');
});

// ── getDateError ──────────────────────────────────────────────

test('getDateError retorna null quando nenhum tipo foi escolhido', () => {
  assert.equal(getDateError(null, { FullDate: '31/02/2020', YearOnly: '1970', Age: '100' }, BIRTH_1986), null);
});

test('getDateError propaga a data de nascimento para o tipo escolhido', () => {
  assert.equal(
    getDateError('YearOnly', { FullDate: '', YearOnly: '1970', Age: '' }, BIRTH_1986),
    'Ano informado não é compatível com a data de nascimento.',
  );
});

// ── parseBirthDate / calculateAge ─────────────────────────────

test('parseBirthDate interpreta aaaa-mm-dd e rejeita valores inválidos', () => {
  const parsed = parseBirthDate(BIRTH_1986);
  assert.ok(parsed);
  assert.equal(parsed.getFullYear(), 1986);
  assert.equal(parsed.getMonth(), 0);
  assert.equal(parsed.getDate(), 1);

  assert.equal(parseBirthDate(null), null);
  assert.equal(parseBirthDate('31/01/1986'), null);
  assert.equal(parseBirthDate('1986-02-31'), null);
});

test('calculateAge considera mês e dia do aniversário', () => {
  assert.equal(calculateAge(new Date(2000, 0, 1), new Date(2020, 0, 1)), 20);
  assert.equal(calculateAge(new Date(2000, 5, 10), new Date(2020, 5, 9)), 19);
  assert.equal(calculateAge(new Date(2000, 5, 10), new Date(2020, 5, 10)), 20);
});
