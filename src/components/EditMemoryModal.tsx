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

type DateValues = {
  FullDate: string;
  YearOnly: string;
  Age: string;
};

const currentYear = new Date().getFullYear();

const EMPTY_DATE_VALUES: DateValues = { FullDate: '', YearOnly: '', Age: '' };

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
  const [dateValues, setDateValues] = useState<DateValues>(EMPTY_DATE_VALUES);

  useEffect(() => {
    if (memory) {
      setTitle(memory.title ?? '');
      setContent(memory.content);
      setDateType(memory.dateType ?? null);

      // Only populate the input value for the currently active date type.
      // Other types remain empty — they will be populated only when the
      // user manually switches to them and types. This prevents e.g. an
      // Age memory's computed EventYear from appearing in the YearOnly input.
      const next: DateValues = { FullDate: '', YearOnly: '', Age: '' };
      if (memory.dateType === 'FullDate' && memory.eventDate) {
        next.FullDate = formatStoredDateToInput(memory.eventDate);
      } else if (memory.dateType === 'YearOnly' && memory.eventYear) {
        next.YearOnly = String(memory.eventYear);
      } else if (memory.dateType === 'Age' && memory.age) {
        next.Age = String(memory.age);
      }
      setDateValues(next);
    }
  }, [memory]);

  const derivedTitlePlaceholder = useMemo(() => {
    if (!content.trim()) return 'Descreva um momento importante...';
    return deriveTitle(content);
  }, [content]);

  const currentDateValue = dateType ? dateValues[dateType] : '';

  const dateError = dateType === 'FullDate' ? getFullDateError(currentDateValue)
    : dateType === 'YearOnly' ? getYearError(currentDateValue)
    : dateType === 'Age' ? getAgeError(currentDateValue)
    : null;

  // A date error only exists when there is actual invalid content in the field.
  // Empty fields are not errors — the user can select a type and not fill it.
  const hasDateError = dateType !== null && dateError !== null;

  // Button is disabled only when:
  // - content is empty, OR
  // - a save is in progress, OR
  // - the typed value has a validation error (invalid format, out of range)
  // An empty date field is NOT an error.
  const canSave = Boolean(content.trim()) && !isSaving && !hasDateError;

  const handleDateTypeChange = useCallback((type: DateType) => {
    setDateType(type);
  }, []);

  const handleDateValueChange = useCallback((type: DateType, value: string) => {
    setDateValues((prev) => ({ ...prev, [type]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!canSave || !memory) return;
    const payload: EditMemoryPayload = {
      title: title.trim() || deriveTitle(content.trim()),
      content: content.trim(),
      isImportant: memory.isImportant ?? false,
    };
    if (dateType && dateType === 'FullDate' && dateValues.FullDate) {
      const parts = dateValues.FullDate.split('/');
      if (parts.length === 3) {
        const [day, month, yearStr] = parts;
        payload.dateType = 'FullDate';
        payload.eventDate = `${yearStr}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        payload.eventYear = parseInt(yearStr, 10);
      }
    } else if (dateType === 'YearOnly' && dateValues.YearOnly) {
      payload.dateType = 'YearOnly';
      payload.eventYear = parseInt(dateValues.YearOnly, 10);
    } else if (dateType === 'Age' && dateValues.Age) {
      const age = parseInt(dateValues.Age, 10);
      payload.dateType = 'Age';
      payload.age = age;
      payload.eventYear = currentYear - age;
    }
    onSave(payload);
  }, [title, content, dateType, dateValues, memory, canSave, onSave]);

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
                    onChange={() => handleDateTypeChange(type)}
                  />
                  {type === 'FullDate' ? '📅 Data completa' : type === 'YearOnly' ? '🗓️ Apenas ano' : '🎂 Idade na época'}
                </label>
              ))}
            </div>

            {dateType === 'FullDate' && (
              <div className="date-value-input">
                <input
                  className={['input', getFullDateError(currentDateValue) ? 'input--invalid' : ''].filter(Boolean).join(' ')}
                  type="text"
                  value={currentDateValue}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d/]/g, '');
                    let formatted = raw;
                    if (raw.length === 2 && !raw.includes('/') && currentDateValue.length < 2) formatted = raw + '/';
                    else if (raw.length === 5 && raw[2] === '/' && !raw.slice(3).includes('/') && currentDateValue.length < 5) formatted = raw + '/';
                    handleDateValueChange('FullDate', formatted);
                  }}
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                />
                {getFullDateError(currentDateValue) ? <span className="date-value-error">{getFullDateError(currentDateValue)}</span> : null}
              </div>
            )}
            {dateType === 'YearOnly' && (
              <div className="date-value-input">
                <input
                  className={['input', getYearError(currentDateValue) ? 'input--invalid' : ''].filter(Boolean).join(' ')}
                  type="text" inputMode="numeric"
                  value={currentDateValue}
                  onChange={(e) => handleDateValueChange('YearOnly', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="Ex: 2018" maxLength={4}
                />
                {getYearError(currentDateValue) ? <span className="date-value-error">{getYearError(currentDateValue)}</span> : null}
              </div>
            )}
            {dateType === 'Age' && (
              <div className="date-value-input">
                <input
                  className={['input', getAgeError(currentDateValue) ? 'input--invalid' : ''].filter(Boolean).join(' ')}
                  type="text" inputMode="numeric"
                  value={currentDateValue}
                  onChange={(e) => handleDateValueChange('Age', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="Ex: 25" maxLength={3}
                />
                {getAgeError(currentDateValue) ? <span className="date-value-error">{getAgeError(currentDateValue)}</span> : null}
                {currentDateValue && !getAgeError(currentDateValue) && (
                  <div className="date-value-hint">
                    ℹ️ Aproximadamente {currentYear - parseInt(currentDateValue, 10)}.
                    Esse ano é usado para posicionar a memória na timeline.
                  </div>
                )}
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
