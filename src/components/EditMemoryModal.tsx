import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from './Button';
import { TextArea } from './TextArea';
import type { MemoryUI, DateType } from '../types/memory';
import { formatMemoryDate } from '../lib/date/formatMemoryDate';
import { deriveTitle } from '../lib/text/deriveTitle';

type EditMemoryDatePayload = {
  dateType?: DateType;
  eventDate?: string;
  eventYear?: number;
  age?: number;
};

type EditMemoryPayload = {
  title?: string;
  content: string;
  isImportant: boolean;
} & EditMemoryDatePayload;

type EditMemoryModalProps = {
  memory: MemoryUI | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: EditMemoryPayload) => void;
};

const currentYear = new Date().getFullYear();

function getFullDateError(customDate: string): string | null {
  if (!customDate) return null;
  const parts = customDate.split('/');
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) return 'Use o formato dd/mm/aaaa.';
  const year = parseInt(parts[2], 10);
  if (year < 1900 || year > currentYear) return `O ano deve estar entre 1900 e ${currentYear}.`;
  const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  if (date > new Date()) return 'A data informada é futura.';
  return null;
}

function getYearError(customYear: string): string | null {
  if (!customYear) return null;
  if (!/^\d+$/.test(customYear)) return 'Use apenas números.';
  const y = Number(customYear);
  if (y < 1900 || y > currentYear) return `O ano deve estar entre 1900 e ${currentYear}.`;
  return null;
}

function getAgeError(customAge: string): string | null {
  if (!customAge) return null;
  if (!/^\d+$/.test(customAge)) return 'Use apenas números.';
  const a = Number(customAge);
  if (a < 0 || a > 120) return 'A idade deve ser entre 0 e 120.';
  return null;
}

function formatStoredDateToInput(eventDate?: string): string {
  if (!eventDate) return '';
  // stored as yyyy-MM-dd → convert to dd/MM/yyyy
  const parts = eventDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return eventDate;
}

export function EditMemoryModal({ memory, isOpen, isSaving, onClose, onSave }: EditMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dateType, setDateType] = useState<DateType | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [customYear, setCustomYear] = useState('');
  const [customAge, setCustomAge] = useState('');

  useEffect(() => {
    if (memory) {
      setTitle(memory.title ?? '');
      setContent(memory.content);
      setDateType(memory.dateType ?? null);
      setCustomDate(memory.eventDate ? formatStoredDateToInput(memory.eventDate) : '');
      setCustomYear(memory.eventYear ? String(memory.eventYear) : '');
      setCustomAge(memory.age ? String(memory.age) : '');
    }
  }, [memory]);

  const derivedTitlePlaceholder = useMemo(() => {
    if (!content.trim()) return 'Descreva um momento importante...';
    return deriveTitle(content);
  }, [content]);

  const dateError = dateType === 'FullDate' ? getFullDateError(customDate)
    : dateType === 'YearOnly' ? getYearError(customYear)
    : dateType === 'Age' ? getAgeError(customAge)
    : null;

  const hasDateError = dateType !== null && dateError !== null;

  const canSave = Boolean(content.trim()) && !isSaving && !hasDateError;

  const handleSave = useCallback(() => {
    if (!canSave || !memory) return;
    const payload: EditMemoryPayload = {
      title: title.trim() || deriveTitle(content.trim()),
      content: content.trim(),
      isImportant: memory.isImportant ?? false,
    };
    if (dateType && dateType === 'FullDate' && customDate) {
      const parts = customDate.split('/');
      if (parts.length === 3) {
        const [day, month, yearStr] = parts;
        payload.dateType = 'FullDate';
        payload.eventDate = `${yearStr}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        payload.eventYear = parseInt(yearStr, 10);
      }
    } else if (dateType === 'YearOnly' && customYear) {
      payload.dateType = 'YearOnly';
      payload.eventYear = parseInt(customYear, 10);
    } else if (dateType === 'Age' && customAge) {
      const age = parseInt(customAge, 10);
      payload.dateType = 'Age';
      payload.age = age;
      payload.eventYear = currentYear - age;
    }
    onSave(payload);
  }, [title, content, dateType, customDate, customYear, customAge, memory, canSave, onSave]);

  if (!isOpen || !memory) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editar memória">
        <div className="modal__header">
          <h2 className="modal__title">Editar memória</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="modal__body">
          <div className="modal__info">
            <span className="modal__info-label">Criada em</span>
            <span className="modal__info-value">{formatMemoryDate(memory.createdAt)}</span>
          </div>

          <label className="input-field">
            <span className="input-field__label">Título <span className="input-field__optional">(opcional)</span></span>
            <input
              className="input"
              type="text"
              value={title}
              placeholder={derivedTitlePlaceholder}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <TextArea
            id="edit-memory-content"
            label="Conteúdo"
            placeholder="Escreva um momento importante..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={500}
          />

          <div className="date-type-selector">
            <span className="date-type-selector__label">Quando isso aconteceu?</span>
            <div className="date-type-options">
              {(['FullDate', 'YearOnly', 'Age'] as DateType[]).map((type) => (
                <label
                  key={type}
                  className={`date-type-option${dateType === type ? ' date-type-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="editDateType"
                    value={type}
                    checked={dateType === type}
                    onChange={() => setDateType(type)}
                  />
                  {type === 'FullDate' ? '📅 Data completa' : type === 'YearOnly' ? '🗓️ Apenas ano' : '🎂 Idade na época'}
                </label>
              ))}
            </div>

            {dateType === 'FullDate' && (
              <div className="date-value-input">
                <input
                  className={['input', getFullDateError(customDate) ? 'input--invalid' : ''].filter(Boolean).join(' ')}
                  type="text"
                  value={customDate}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d/]/g, '');
                    let formatted = raw;
                    if (raw.length === 2 && !raw.includes('/') && customDate.length < 2) formatted = raw + '/';
                    else if (raw.length === 5 && raw[2] === '/' && !raw.slice(3).includes('/') && customDate.length < 5) formatted = raw + '/';
                    setCustomDate(formatted);
                  }}
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                />
                {getFullDateError(customDate) ? <span className="date-value-error">{getFullDateError(customDate)}</span> : null}
              </div>
            )}
            {dateType === 'YearOnly' && (
              <div className="date-value-input">
                <input
                  className={['input', getYearError(customYear) ? 'input--invalid' : ''].filter(Boolean).join(' ')}
                  type="text" inputMode="numeric"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="Ex: 2018" maxLength={4}
                />
                {getYearError(customYear) ? <span className="date-value-error">{getYearError(customYear)}</span> : null}
              </div>
            )}
            {dateType === 'Age' && (
              <div className="date-value-input">
                <input
                  className={['input', getAgeError(customAge) ? 'input--invalid' : ''].filter(Boolean).join(' ')}
                  type="text" inputMode="numeric"
                  value={customAge}
                  onChange={(e) => setCustomAge(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="Ex: 25" maxLength={3}
                />
                {getAgeError(customAge) ? <span className="date-value-error">{getAgeError(customAge)}</span> : null}
              </div>
            )}
          </div>
        </div>

        <div className="modal__footer">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="button" disabled={!canSave} onClick={handleSave}>
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
